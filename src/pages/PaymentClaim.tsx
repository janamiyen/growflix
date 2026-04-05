import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Upload, MessageCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_WHATSAPP } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const claimSchema = z.object({
  whatsapp: z.string().min(8, "Ingresá un WhatsApp válido").max(20),
  email: z.string().email("Ingresá un email válido").max(255),
  name: z.string().max(100).optional(),
});

const PaymentClaim = () => {
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = claimSchema.safeParse({ whatsapp, email, name: name || undefined });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      let receiptUrl: string | null = null;

      // Upload receipt if provided
      if (receipt) {
        const fileExt = receipt.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("payment-receipts")
          .upload(fileName, receipt);

        if (uploadError) {
          throw new Error("Error subiendo comprobante");
        }
        
        receiptUrl = fileName;
      }

      // Create payment claim via secure RPC
      const { error } = await supabase.rpc("create_payment_claim", {
        _name: name.trim() || "",
        _email: email.trim(),
        _whatsapp: whatsapp.trim(),
        _receipt_url: receiptUrl,
      });

      if (error) throw error;

      setSubmitted(true);
    } catch (error: unknown) {
      console.error("Error submitting claim:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Hubo un error al enviar. Intentá de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="mx-auto max-w-lg text-center">
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-8">
              <CheckCircle className="mx-auto h-16 w-16 text-primary" />

              <h1 className="mt-6 font-display text-3xl font-bold text-foreground">
                ¡Bienvenido/a a Growflix!
              </h1>

              <p className="mt-4 text-muted-foreground">
                Gracias por ser parte de este hermoso mundo. Recibimos tu confirmación de pago y estamos procesándola.
              </p>

              <p className="mt-2 text-muted-foreground">
                Cuando lo aprobemos, te va a llegar un link por email para entrar. No hace falta que crees una cuenta, el link te loguea automáticamente.
              </p>

              <div className="mt-6 rounded-xl bg-background/50 p-4 text-left text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Pasos a seguir:</p>
                <p>1. Revisá tu email (incluyendo spam) — te va a llegar un link de acceso.</p>
                <p>2. Si en 24hs no recibiste nada, escribinos por WhatsApp así lo solucionamos.</p>
              </div>

              <a
                href={`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent("Hola! Acabo de pagar la suscripción a Growflix. Mi email es: " + email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Escribinos por WhatsApp
                </Button>
              </a>

              <p className="mt-4 text-xs text-muted-foreground">
                Normalmente activamos cuentas en menos de 24 horas.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Confirmá tu pago
            </h1>
            
            <p className="mt-2 text-muted-foreground">
              Completá tus datos para que podamos activar tu cuenta.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {/* WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp *</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                />
                {errors.whatsapp && (
                  <p className="text-sm text-destructive">{errors.whatsapp}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre (opcional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Receipt */}
              <div className="space-y-2">
                <Label htmlFor="receipt">Comprobante de pago (opcional)</Label>
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="receipt"
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm transition-colors hover:bg-secondary"
                  >
                    <Upload className="h-4 w-4" />
                    {receipt ? receipt.name : "Subir archivo"}
                  </label>
                  <input
                    id="receipt"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                  />
                  {receipt && (
                    <button
                      type="button"
                      onClick={() => setReceipt(null)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="premium"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Ya pagué"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentClaim;
