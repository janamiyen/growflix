import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface PaywallGateProps {
  children: ReactNode;
}

const PaywallGate = ({ children }: PaywallGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();

  if (authLoading || subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!isActive) {
    return <Navigate to={ROUTES.CHECKOUT} replace />;
  }

  return <>{children}</>;
};

export default PaywallGate;
