import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAccessGrant } from "@/hooks/useAccessGrant";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface PaywallGateProps {
  children: ReactNode;
}

const PaywallGate = ({ children }: PaywallGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: accessLoading } = useAccessGrant();

  if (authLoading || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!hasAccess) {
    return <Navigate to={ROUTES.NO_ACCESS} replace />;
  }

  return <>{children}</>;
};

export default PaywallGate;
