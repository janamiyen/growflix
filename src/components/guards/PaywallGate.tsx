import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAccessGrant } from "@/hooks/useAccessGrant";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ROUTES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface PaywallGateProps {
  children: ReactNode;
}

const PaywallGate = ({ children }: PaywallGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: accessLoading } = useAccessGrant();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || accessLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Admins bypass paywall
  if (isAdmin) {
    return <>{children}</>;
  }

  if (!hasAccess) {
    return <Navigate to={ROUTES.NO_ACCESS} replace />;
  }

  return <>{children}</>;
};

export default PaywallGate;
