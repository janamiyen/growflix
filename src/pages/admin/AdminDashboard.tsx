import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Users,
  Clock,
  AlertCircle,
  RefreshCw,
  Ban,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentClaim {
  id: string;
  email: string;
  whatsapp: string;
  name: string | null;
  receipt_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
}

interface AccessGrant {
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface Stats {
  activeUsers: number;
  pendingClaims: number;
  expiredUsers: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    activeUsers: 0,
    pendingClaims: 0,
    expiredUsers: 0,
  });
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [activeGrants, setActiveGrants] = useState<AccessGrant[]>([]);
  const [expiredGrants, setExpiredGrants] = useState<AccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<PaymentClaim | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [detailsClaim, setDetailsClaim] = useState<PaymentClaim | null>(null);
  const [detailsEmail, setDetailsEmail] = useState<string | null>(null);
  const { toast } = useToast();

  const viewDetails = (email: string) => {
    const normalized = email.trim().toLowerCase();
    const match = claims
      .filter((c) => c.email.trim().toLowerCase() === normalized)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

    setDetailsEmail(email);
    setDetailsClaim(match ?? null);
  };

  const fetchAllData = async () => {
    setLoading(true);
    const now = new Date().toISOString();

    // Fetch payment claims
    const { data: claimsData } = await supabase
      .from("payment_claims")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch active grants
    const { data: activeData } = await supabase
      .from("access_grants")
      .select("*")
      .eq("status", "active")
      .gt("expires_at", now)
      .order("expires_at", { ascending: true });

    // Fetch expired/revoked grants
    const { data: expiredData } = await supabase
      .from("access_grants")
      .select("*")
      .or(`expires_at.lt.${now},status.eq.revoked`)
      .order("expires_at", { ascending: false });

    setClaims(claimsData || []);
    setActiveGrants(activeData || []);
    setExpiredGrants(expiredData || []);

    // Calculate stats
    const pendingCount = (claimsData || []).filter(c => c.status === "pending").length;
    
    setStats({
      activeUsers: (activeData || []).length,
      pendingClaims: pendingCount,
      expiredUsers: (expiredData || []).length,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAction = async () => {
    if (!selectedClaim || !actionType) return;

    setProcessing(selectedClaim.id);

    try {
      if (actionType === "approve") {
        const normalizedEmail = selectedClaim.email.trim().toLowerCase();

        const { data: existingGrant } = await supabase
          .from("access_grants")
          .select("email, status, expires_at")
          .eq("email", normalizedEmail)
          .maybeSingle();

        const now = new Date();
        const currentExpiry = existingGrant?.expires_at
          ? new Date(existingGrant.expires_at)
          : null;

        const isRenewal = currentExpiry && currentExpiry > now;
        const base = isRenewal ? currentExpiry : now;
        const newExpires = new Date(base);
        newExpires.setDate(newExpires.getDate() + 30);

        const { error: grantError } = await supabase
          .from("access_grants")
          .upsert(
            {
              email: normalizedEmail,
              status: "active",
              expires_at: newExpires.toISOString(),
            },
            { onConflict: "email" }
          );

        if (grantError) throw grantError;

        const { error: claimError } = await supabase
          .from("payment_claims")
          .update({
            status: "approved",
            admin_note: adminNote || null,
          })
          .eq("id", selectedClaim.id);

        if (claimError) throw claimError;

        const formattedExpiry = newExpires.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        toast({
          title: isRenewal ? "¡Acceso renovado!" : "¡Acceso aprobado!",
          description: `Acceso ${isRenewal ? "renovado" : "habilitado"} hasta ${formattedExpiry}. El usuario puede ingresar con su email y contraseña.`,
        });
      } else {
        const { error } = await supabase
          .from("payment_claims")
          .update({
            status: "rejected",
            admin_note: adminNote || null,
          })
          .eq("id", selectedClaim.id);

        if (error) throw error;

        toast({
          title: "Solicitud rechazada",
          description: "La solicitud ha sido marcada como rechazada.",
        });
      }

      fetchAllData();
      setSelectedClaim(null);
      setAdminNote("");
      setActionType(null);
    } catch (error: unknown) {
      console.error("Error processing claim:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Hubo un error al procesar.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const renewGrant = async (email: string) => {
    setProcessing(email);

    try {
      const { data: existingGrant } = await supabase
        .from("access_grants")
        .select("expires_at")
        .eq("email", email)
        .maybeSingle();

      const now = new Date();
      const currentExpiry = existingGrant?.expires_at
        ? new Date(existingGrant.expires_at)
        : null;

      const isStillActive = currentExpiry && currentExpiry > now;
      const base = isStillActive ? currentExpiry : now;
      const newExpires = new Date(base);
      newExpires.setDate(newExpires.getDate() + 30);

      const { error } = await supabase
        .from("access_grants")
        .update({
          status: "active",
          expires_at: newExpires.toISOString(),
        })
        .eq("email", email);

      if (error) throw error;

      const formattedExpiry = newExpires.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      toast({
        title: "Acceso renovado",
        description: `Nuevo vencimiento: ${formattedExpiry}`,
      });

      fetchAllData();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo renovar el acceso.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const revokeGrant = async (email: string) => {
    setProcessing(email);

    try {
      const { error } = await supabase
        .from("access_grants")
        .update({ status: "revoked" })
        .eq("email", email);

      if (error) throw error;

      toast({
        title: "Acceso revocado",
        description: `El acceso de ${email} ha sido revocado.`,
      });

      fetchAllData();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo revocar el acceso.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const revokeAllExpired = async () => {
    const { data, error } = await supabase
      .from("access_grants")
      .update({ status: "revoked" })
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString())
      .select("id");

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron revocar los accesos expirados.",
        variant: "destructive",
      });
    } else {
      const count = data?.length ?? 0;
      toast({
        title: "Accesos revocados",
        description:
          count > 0
            ? `${count} acceso(s) expirados marcados como revocados.`
            : "No había accesos expirados pendientes.",
      });
      fetchAllData();
    }
  };

  const getReceiptUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(path, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const claimStatusBadge = (status: PaymentClaim["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            🟡 Pendiente
          </Badge>
        );
      case "approved":
        return <Badge className="bg-primary">✅ Aprobado</Badge>;
      case "rejected":
        return <Badge variant="destructive">❌ Rechazado</Badge>;
    }
  };

  const pendingClaims = claims.filter((c) => c.status === "pending");
  const processedClaims = claims.filter((c) => c.status !== "pending");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Administrador — Growflix
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gestioná accesos, pagos y usuarios.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios activos
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "..." : stats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Con acceso vigente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes de aprobar
            </CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "..." : stats.pendingClaims}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Solicitudes sin procesar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios vencidos
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {loading ? "..." : stats.expiredUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expirados o revocados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acción global */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={revokeAllExpired}>
          <Ban className="h-4 w-4 mr-2" />
          Revocar accesos expirados
        </Button>
      </div>

      {/* Solicitudes pendientes */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Solicitudes de acceso
          </h2>
          <p className="text-sm text-muted-foreground">
            Personas que dejaron sus datos. Revisá pagos y habilitá accesos.
          </p>
        </div>

        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="py-3">
            <p className="text-sm text-foreground">
              💡 <strong>Al aprobar</strong>, el usuario podrá ingresar desde{" "}
              <code className="bg-muted px-1 rounded">/acceso</code> con su email y contraseña.
            </p>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : pendingClaims.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No hay solicitudes pendientes
                  </TableCell>
                </TableRow>
              ) : (
                pendingClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">
                      {claim.name || "-"}
                    </TableCell>
                    <TableCell>{claim.email}</TableCell>
                    <TableCell>
                      <a
                        href={`https://wa.me/${claim.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {claim.whatsapp}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(claim.created_at)}
                    </TableCell>
                    <TableCell>
                      {claim.receipt_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => getReceiptUrl(claim.receipt_url!)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{claimStatusBadge(claim.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedClaim(claim);
                            setActionType("approve");
                          }}
                          disabled={processing === claim.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClaim(claim);
                            setActionType("reject");
                          }}
                          disabled={processing === claim.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Historial de solicitudes procesadas */}
        {processedClaims.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Ver historial de solicitudes procesadas ({processedClaims.length})
            </summary>
            <div className="mt-2 rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>{claim.name || "-"}</TableCell>
                      <TableCell>{claim.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(claim.created_at)}
                      </TableCell>
                      <TableCell>{claimStatusBadge(claim.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </details>
        )}
      </section>

      {/* Usuarios activos */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Usuarios con acceso activo
          </h2>
          <p className="text-sm text-muted-foreground">
            Usuarios con suscripción vigente.
          </p>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Activo hasta</TableHead>
                <TableHead>Días restantes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : activeGrants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No hay usuarios con acceso activo
                  </TableCell>
                </TableRow>
              ) : (
                activeGrants.map((grant) => {
                  const daysLeft = getDaysRemaining(grant.expires_at);
                  return (
                    <TableRow key={grant.email}>
                      <TableCell className="font-medium">{grant.email}</TableCell>
                      <TableCell>{formatDate(grant.expires_at)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={daysLeft <= 7 ? "destructive" : "outline"}
                          className={daysLeft <= 7 ? "" : "border-primary text-primary"}
                        >
                          {daysLeft} días
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary">🟢 Activo</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewDetails(grant.email)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver detalles
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => renewGrant(grant.email)}
                            disabled={processing === grant.email}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Renovar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeGrant(grant.email)}
                            disabled={processing === grant.email}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Revocar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Usuarios vencidos */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Usuarios vencidos
          </h2>
          <p className="text-sm text-muted-foreground">
            Usuarios con acceso expirado o revocado.
          </p>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Venció el</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : expiredGrants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No hay usuarios vencidos
                  </TableCell>
                </TableRow>
              ) : (
                expiredGrants.map((grant) => (
                  <TableRow key={grant.email}>
                    <TableCell className="font-medium">{grant.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(grant.expires_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">🔴 Vencido</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDetails(grant.email)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => renewGrant(grant.email)}
                          disabled={processing === grant.email}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Renovar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!selectedClaim && !!actionType}
        onOpenChange={() => {
          setSelectedClaim(null);
          setActionType(null);
          setAdminNote("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Aprobar y activar acceso"
                : "Rechazar solicitud"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `Se habilitará acceso para ${selectedClaim?.email} con 30 días de duración.`
                : `La solicitud de ${selectedClaim?.email} será marcada como rechazada.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nota (opcional)</label>
              <Textarea
                placeholder="Agregar una nota..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedClaim(null);
                setActionType(null);
                setAdminNote("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={processing === selectedClaim?.id}
            >
              {processing === selectedClaim?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionType === "approve" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={!!detailsEmail}
        onOpenChange={() => {
          setDetailsEmail(null);
          setDetailsClaim(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del usuario</DialogTitle>
            <DialogDescription>
              Información del comprobante de pago más reciente.
            </DialogDescription>
          </DialogHeader>

          {detailsClaim ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Nombre
                </p>
                <p className="text-foreground">{detailsClaim.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Email de la solicitud
                </p>
                <p className="text-foreground break-all">{detailsClaim.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  WhatsApp
                </p>
                <a
                  href={`https://wa.me/${detailsClaim.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {detailsClaim.whatsapp}
                </a>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Fecha de la solicitud
                </p>
                <p className="text-foreground">
                  {formatDateTime(detailsClaim.created_at)}
                </p>
              </div>
              {detailsClaim.admin_note && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nota del admin
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">
                    {detailsClaim.admin_note}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Comprobante
                </p>
                {detailsClaim.receipt_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => getReceiptUrl(detailsClaim.receipt_url!)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver comprobante
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin comprobante adjunto
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                No se encontró una solicitud de pago asociada a{" "}
                <span className="text-foreground font-medium break-all">
                  {detailsEmail}
                </span>
                . Probablemente el acceso fue otorgado manualmente sin pasar por
                el formulario de pago.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDetailsEmail(null);
                setDetailsClaim(null);
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
