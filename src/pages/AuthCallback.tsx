import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/constants";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Check URL hash for recovery event
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get("type");

      if (type === "recovery") {
        setIsRecovery(true);
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user?.email) {
          setError("No se pudo verificar la sesión. Intentá iniciar sesión nuevamente.");
          return;
        }

        const normalizedEmail = session.user.email.trim().toLowerCase();

        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) {
          navigate(ROUTES.ADMIN, { replace: true });
          return;
        }

        // Check access grant
        const { data: grant } = await supabase
          .from("access_grants")
          .select("email, status, expires_at")
          .eq("email", normalizedEmail)
          .eq("status", "active")
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (grant) {
          navigate(ROUTES.APP, { replace: true });
        } else {
          navigate(ROUTES.NO_ACCESS, { replace: true });
        }
      } catch {
        setError("Error inesperado. Intentá nuevamente.");
      }
    };

    handleCallback();
  }, [navigate]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "Mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    toast({
      title: "Contraseña actualizada",
      description: "Ya podés ingresar con tu nueva contraseña.",
    });
    navigate(ROUTES.LOGIN, { replace: true });
  };

  if (isRecovery) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold text-foreground text-center">
            Nueva contraseña
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Elegí tu nueva contraseña para ingresar
          </p>

          <form onSubmit={handleSetPassword} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar contraseña"
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <p className="text-destructive text-center">{error}</p>
        <a href={ROUTES.LOGIN} className="mt-4 text-primary hover:underline">
          Ir a iniciar sesión
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Verificando acceso...</p>
    </div>
  );
};

export default AuthCallback;
