import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/constants";
import growflixLockup from "@/assets/growflix-lockup.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: window.location.origin + ROUTES.AUTH_CALLBACK,
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el magic link",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="mx-auto max-w-sm">
            <div className="mb-8 text-center">
              <img
                src={growflixLockup}
                alt="GROWFLIX"
                className="mx-auto h-12 w-auto"
              />
            </div>

            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>

              <h1 className="font-display text-2xl font-bold text-foreground">
                ¡Listo!
              </h1>

              <p className="mt-4 text-muted-foreground">
                Revisá tu email <span className="font-medium text-foreground">{email}</span> y hacé clic en el enlace para ingresar.
              </p>

              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-primary hover:underline"
              >
                Usar otro email
              </button>
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
        <div className="mx-auto max-w-sm">
          <div className="mb-8 text-center">
            <img
              src={growflixLockup}
              alt="GROWFLIX"
              className="mx-auto h-12 w-auto"
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-8">
            <h1 className="font-display text-2xl font-bold text-foreground text-center">
              Iniciar sesión
            </h1>

            <p className="mt-2 text-center text-sm text-muted-foreground">
              Ingresá tu email y te enviamos un enlace de acceso
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar magic link
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿No tenés cuenta?{" "}
              <Link to={ROUTES.CHECKOUT} className="text-primary hover:underline">
                Suscribite
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
