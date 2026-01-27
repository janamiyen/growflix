import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setError("Error al verificar la sesión");
        return;
      }

      if (session?.user?.email) {
        // Session established, check access grant
        const normalizedEmail = session.user.email.trim().toLowerCase();

        const { data: grant, error: grantError } = await supabase
          .from("access_grants")
          .select("email, status, expires_at")
          .eq("email", normalizedEmail)
          .eq("status", "active")
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (grantError) {
          console.error("Error checking access:", grantError);
        }

        if (grant) {
          // Has valid access
          navigate(ROUTES.APP, { replace: true });
        } else {
          // No valid access
          navigate("/sin-acceso", { replace: true });
        }
      } else {
        // No session yet, retry
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkSession, 500);
        } else {
          setError("No se pudo establecer la sesión. Intentá nuevamente.");
        }
      }
    };

    checkSession();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <p className="text-destructive text-center">{error}</p>
        <a href={ROUTES.LOGIN} className="mt-4 text-primary hover:underline">
          Volver a intentar
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
