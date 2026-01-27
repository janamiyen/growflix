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
import { CheckCircle, XCircle, ExternalLink, Loader2, Eye } from "lucide-react";
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

const AdminPayments = () => {
  const [claims, setClaims] = useState<PaymentClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<PaymentClaim | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const { toast } = useToast();

  const fetchClaims = async () => {
    const { data, error } = await supabase
      .from("payment_claims")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching claims:", error);
    } else {
      setClaims(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleAction = async () => {
    if (!selectedClaim || !actionType) return;

    setProcessing(selectedClaim.id);

    try {
      if (actionType === "approve") {
        // Normalize email
        const normalizedEmail = selectedClaim.email.trim().toLowerCase();

        // Check for existing grant to support renewal
        const { data: existingGrant } = await supabase
          .from("access_grants")
          .select("email, status, expires_at")
          .eq("email", normalizedEmail)
          .maybeSingle();

        // Calculate new expiry with renewal logic
        const now = new Date();
        const currentExpiry = existingGrant?.expires_at 
          ? new Date(existingGrant.expires_at) 
          : null;
        
        // If current expiry is in the future, extend from there; otherwise from now
        const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
        const newExpires = new Date(base);
        newExpires.setDate(newExpires.getDate() + 30);

        // Upsert access grant
        const { error: grantError } = await supabase
          .from("access_grants")
          .upsert({
            email: normalizedEmail,
            status: "active",
            expires_at: newExpires.toISOString(),
          }, {
            onConflict: "email",
          });

        if (grantError) throw grantError;

        // Update claim status
        const { error: claimError } = await supabase
          .from("payment_claims")
          .update({
            status: "approved",
            admin_note: adminNote || null,
          })
          .eq("id", selectedClaim.id);

        if (claimError) throw claimError;

        // Format expiry date for toast
        const formattedExpiry = newExpires.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        toast({
          title: existingGrant ? "¡Acceso renovado!" : "¡Acceso aprobado!",
          description: `Acceso ${existingGrant ? "renovado" : "habilitado"} hasta ${formattedExpiry}. El usuario puede entrar con magic link.`,
        });
      } else {
        // Reject - only update payment_claims
        const { error } = await supabase
          .from("payment_claims")
          .update({
            status: "rejected",
            admin_note: adminNote || null,
          })
          .eq("id", selectedClaim.id);

        if (error) throw error;

        toast({
          title: "Claim rechazado",
          description: "El claim ha sido marcado como rechazado.",
        });
      }

      // Refresh data
      fetchClaims();
      setSelectedClaim(null);
      setAdminNote("");
      setActionType(null);
    } catch (error: unknown) {
      console.error("Error processing claim:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Hubo un error al procesar el claim.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusBadge = (status: PaymentClaim["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pendiente</Badge>;
      case "approved":
        return <Badge className="bg-primary">Aprobado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>;
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">
        Pagos
      </h1>
      <p className="mt-2 text-muted-foreground">
        Gestionar claims de pago y activar suscripciones
      </p>

      {/* Claims Table */}
      <div className="mt-8 rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Nombre</TableHead>
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
            ) : claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay claims de pago
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(claim.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">{claim.email}</TableCell>
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
                  <TableCell>{claim.name || "-"}</TableCell>
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
                  <TableCell>{statusBadge(claim.status)}</TableCell>
                  <TableCell className="text-right">
                    {claim.status === "pending" && (
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
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedClaim && !!actionType} onOpenChange={() => {
        setSelectedClaim(null);
        setActionType(null);
        setAdminNote("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Aprobar y activar suscripción" : "Rechazar claim"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `Se creará/activará la cuenta para ${selectedClaim?.email} con 30 días de acceso.`
                : `El claim de ${selectedClaim?.email} será marcado como rechazado.`}
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
    </div>
  );
};

export default AdminPayments;
