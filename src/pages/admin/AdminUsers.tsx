import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Loader2, Search } from "lucide-react";
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

interface AuthUser {
  id: string;
  email: string | undefined;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

type UserStatus =
  | "active"
  | "expired"
  | "revoked"
  | "pending"
  | "rejected"
  | "registered"
  | "none";

interface UnifiedUser {
  email: string;
  name: string | null;
  whatsapp: string | null;
  status: UserStatus;
  expires_at: string | null;
  first_seen: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  in_auth: boolean;
  latest_claim: PaymentClaim | null;
}

const AdminUsers = () => {
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [authUsersError, setAuthUsersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailsClaim, setDetailsClaim] = useState<PaymentClaim | null>(null);
  const [detailsEmail, setDetailsEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const [claimsRes, grantsRes, authRes] = await Promise.all([
        supabase
          .from("payment_claims")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("access_grants")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.functions.invoke<{ users: AuthUser[] }>("list-users"),
      ]);

      if (claimsRes.error) {
        console.error("Error fetching claims:", claimsRes.error);
      }
      if (grantsRes.error) {
        console.error("Error fetching grants:", grantsRes.error);
      }
      if (authRes.error) {
        console.error("Error fetching auth users:", authRes.error);
        setAuthUsersError(
          "No se pudo cargar la lista de usuarios registrados. Desplegá la Edge Function 'list-users' para ver también quienes se registraron sin pagar."
        );
        setAuthUsers([]);
      } else {
        setAuthUsersError(null);
        setAuthUsers(authRes.data?.users ?? []);
      }

      setClaims(claimsRes.data || []);
      setGrants(grantsRes.data || []);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const users = useMemo<UnifiedUser[]>(() => {
    const now = new Date();
    const byEmail = new Map<string, UnifiedUser>();

    grants.forEach((g) => {
      const email = g.email.trim().toLowerCase();
      const isActive = g.status === "active" && new Date(g.expires_at) > now;
      const isRevoked = g.status === "revoked";
      const status: UserStatus = isActive
        ? "active"
        : isRevoked
        ? "revoked"
        : "expired";

      byEmail.set(email, {
        email,
        name: null,
        whatsapp: null,
        status,
        expires_at: g.expires_at,
        first_seen: g.created_at,
        last_sign_in_at: null,
        email_confirmed: false,
        in_auth: false,
        latest_claim: null,
      });
    });

    claims.forEach((c) => {
      const email = c.email.trim().toLowerCase();
      const existing = byEmail.get(email);

      if (existing) {
        if (!existing.latest_claim) {
          existing.latest_claim = c;
        }
        existing.name = existing.name ?? c.name;
        existing.whatsapp = existing.whatsapp ?? c.whatsapp;
        if (new Date(c.created_at) < new Date(existing.first_seen)) {
          existing.first_seen = c.created_at;
        }
      } else {
        const status: UserStatus =
          c.status === "pending"
            ? "pending"
            : c.status === "rejected"
            ? "rejected"
            : "none";

        byEmail.set(email, {
          email,
          name: c.name,
          whatsapp: c.whatsapp,
          status,
          expires_at: null,
          first_seen: c.created_at,
          last_sign_in_at: null,
          email_confirmed: false,
          in_auth: false,
          latest_claim: c,
        });
      }
    });

    authUsers.forEach((a) => {
      if (!a.email) return;
      const email = a.email.trim().toLowerCase();
      const existing = byEmail.get(email);

      if (existing) {
        existing.in_auth = true;
        existing.email_confirmed = !!a.email_confirmed_at;
        existing.last_sign_in_at = a.last_sign_in_at;
        if (new Date(a.created_at) < new Date(existing.first_seen)) {
          existing.first_seen = a.created_at;
        }
      } else {
        byEmail.set(email, {
          email,
          name: null,
          whatsapp: null,
          status: "registered",
          expires_at: null,
          first_seen: a.created_at,
          last_sign_in_at: a.last_sign_in_at,
          email_confirmed: !!a.email_confirmed_at,
          in_auth: true,
          latest_claim: null,
        });
      }
    });

    const order: Record<UserStatus, number> = {
      active: 0,
      pending: 1,
      registered: 2,
      expired: 3,
      revoked: 4,
      rejected: 5,
      none: 6,
    };

    return Array.from(byEmail.values()).sort((a, b) => {
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return (
        new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime()
      );
    });
  }, [claims, grants, authUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        (u.name?.toLowerCase().includes(term) ?? false) ||
        (u.whatsapp?.toLowerCase().includes(term) ?? false)
    );
  }, [users, search]);

  const formatDate = (date: string | null) => {
    if (!date) return "-";
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

  const getReceiptUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(path, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast({
        title: "Error",
        description: "No se pudo generar el link del comprobante.",
        variant: "destructive",
      });
    }
  };

  const statusBadge = (status: UserStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary">🟢 Activo</Badge>;
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            🟡 Pendiente
          </Badge>
        );
      case "registered":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            🔵 Registrado
          </Badge>
        );
      case "expired":
        return <Badge variant="destructive">🔴 Expirado</Badge>;
      case "revoked":
        return <Badge variant="destructive">⚫ Revocado</Badge>;
      case "rejected":
        return <Badge variant="secondary">❌ Rechazado</Badge>;
      case "none":
        return <Badge variant="secondary">Sin acceso</Badge>;
    }
  };

  const activeCount = users.filter((u) => u.status === "active").length;
  const pendingCount = users.filter((u) => u.status === "pending").length;
  const registeredCount = users.filter((u) => u.status === "registered").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Usuarios
        </h1>
        <p className="mt-2 text-muted-foreground">
          {loading
            ? "Cargando..."
            : `${users.length} usuarios totales · ${activeCount} activos · ${pendingCount} pendientes · ${registeredCount} registrados sin pagar`}
        </p>
        {authUsersError && (
          <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ {authUsersError}
          </div>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por email, nombre o WhatsApp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Registro</TableHead>
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
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {search
                    ? "No se encontraron usuarios con esa búsqueda"
                    : "No hay usuarios registrados"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.email}>
                  <TableCell className="font-medium">
                    {u.name || "-"}
                  </TableCell>
                  <TableCell className="break-all">{u.email}</TableCell>
                  <TableCell>
                    {u.whatsapp ? (
                      <a
                        href={`https://wa.me/${u.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {u.whatsapp}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(u.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(u.expires_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(u.first_seen)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDetailsEmail(u.email);
                        setDetailsClaim(u.latest_claim);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              Información asociada al comprobante de pago más reciente.
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
                  Email
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
                No hay comprobante asociado a{" "}
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

export default AdminUsers;
