import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";
import growflixLockup from "@/assets/growflix-lockup.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast({
        title: "Ingresá tu email",
        description: "Escribí tu email arriba y después hacé clic en 'Olvidé mi contraseña'.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el email.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email enviado",
        description: "Revisá tu casilla para restablecer tu contraseña.",
      });
    }
    setResetLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (isRegister) {
      if (password.length < 6) {
        toast({
          title: "Contraseña muy corta",
          description: "La contraseña debe tener al menos 6 caracteres.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await signUp(normalizedEmail, password);

      if (error) {
        toast({
          title: "Error al crear cuenta",
          description: error.message || "No se pudo crear la cuenta.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Cuenta creada",
        description: "Ya podés iniciar sesión con tu email y contraseña.",
      });
      setIsRegister(false);
      setPassword("");
      setLoading(false);
    } else {
      const { error } = await signIn(normalizedEmail, password);

      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: error.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos."
            : error.message || "No se pudo iniciar sesión.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      navigate(ROUTES.APP, { replace: true });
    }
  };

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
              {isRegister ? "Crear cuenta" : "Iniciar sesión"}
            </h1>

            <p className="mt-2 text-center text-sm text-muted-foreground">
              {isRegister
                ? "Registrate para acceder a los cursos"
                : "Ingresá para ver tus cursos"}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isRegister ? "Mínimo 6 caracteres" : "Tu contraseña"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isRegister ? 6 : undefined}
                />
                {!isRegister && (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    {resetLoading ? "Enviando..." : "Olvidé mi contraseña"}
                  </button>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRegister ? "Creando cuenta..." : "Ingresando..."}
                  </>
                ) : isRegister ? (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear cuenta
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Ingresar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isRegister ? (
                <>
                  ¿Ya tenés cuenta?{" "}
                  <button
                    onClick={() => { setIsRegister(false); setPassword(""); }}
                    className="text-primary hover:underline"
                  >
                    Iniciá sesión
                  </button>
                </>
              ) : (
                <>
                  ¿No tenés cuenta?{" "}
                  <button
                    onClick={() => { setIsRegister(true); setPassword(""); }}
                    className="text-primary hover:underline"
                  >
                    Registrate
                  </button>
                </>
              )}
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to={ROUTES.CHECKOUT} className="text-primary hover:underline">
                Ver suscripciones
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
