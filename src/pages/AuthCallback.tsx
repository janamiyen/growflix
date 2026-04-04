import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/constants";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxAttempts = 10;

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Error al verificar la sesión");
          return;
        }

        if (session?.user?.email) {
          const normalizedEmail = session.user.email.trim().toLowerCase();

          // Check if user is admin
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (roleData) {
            navigate(ROUTES.APP, { replace: true });
            return;
          }

          // Check access grant
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
            navigate(ROUTES.APP, { replace: true });
          } else {
            navigate(ROUTES.NO_ACCESS, { replace: true });
          }
        } else {
          // No session yet, retry
          attemptsRef.current += 1;
          if (attemptsRef.current < maxAttempts) {
            timeoutRef.current = setTimeout(checkSession, 500);
          } else {
            setError("No se pudo establecer la sesión. Intentá nuevamente.");
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Error inesperado. Intentá nuevamente.");
      }
    };

    checkSession();

    // Cleanup timeouts on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
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
