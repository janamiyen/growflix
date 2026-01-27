import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut } from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import growflixLockup from "@/assets/growflix-lockup.png";

const NoAccess = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-md text-center">
          <img
            src={growflixLockup}
            alt="GROWFLIX"
            className="mx-auto mb-8 h-12 w-auto"
          />

          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>

            <h1 className="font-display text-2xl font-bold text-foreground">
              Acceso no habilitado
            </h1>

            <p className="mt-4 text-muted-foreground">
              Tu acceso aún no está habilitado o expiró.
            </p>

            {user?.email && (
              <p className="mt-2 text-sm text-muted-foreground">
                Email: <span className="font-medium text-foreground">{user.email}</span>
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <Button asChild size="lg" className="w-full">
                <Link to={ROUTES.CHECKOUT}>Ir a pagar</Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to={ROUTES.PAYMENT_CLAIM}>Confirmar pago</Link>
              </Button>
            </div>

            <button
              onClick={handleSignOut}
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoAccess;
