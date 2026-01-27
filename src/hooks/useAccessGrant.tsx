import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AccessGrant {
  email: string;
  status: string;
  expires_at: string;
}

interface UseAccessGrantReturn {
  hasAccess: boolean;
  loading: boolean;
  grant: AccessGrant | null;
}

export const useAccessGrant = (): UseAccessGrantReturn => {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [grant, setGrant] = useState<AccessGrant | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;

      if (!user?.email) {
        setHasAccess(false);
        setGrant(null);
        setLoading(false);
        return;
      }

      const normalizedEmail = user.email.trim().toLowerCase();

      const { data, error } = await supabase
        .from("access_grants")
        .select("email, status, expires_at")
        .eq("email", normalizedEmail)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error("Error checking access grant:", error);
        setHasAccess(false);
        setGrant(null);
      } else if (data) {
        setHasAccess(true);
        setGrant(data);
      } else {
        setHasAccess(false);
        setGrant(null);
      }

      setLoading(false);
    };

    checkAccess();
  }, [user, authLoading]);

  return { hasAccess, loading, grant };
};
