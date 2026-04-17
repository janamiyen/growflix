import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
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
