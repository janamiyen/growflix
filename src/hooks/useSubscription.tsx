import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type SubscriptionStatus = "none" | "pending" | "active" | "expired";

interface Subscription {
  status: SubscriptionStatus;
  started_at: string | null;
  expires_at: string | null;
}

export const useSubscription = () => {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, started_at, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        setSubscription(null);
      } else if (data) {
        // Check if subscription has expired
        const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
        setSubscription({
          status: isExpired ? "expired" : (data.status as SubscriptionStatus),
          started_at: data.started_at,
          expires_at: data.expires_at,
        });
      } else {
        setSubscription({ status: "none", started_at: null, expires_at: null });
      }
      setLoading(false);
    };

    fetchSubscription();
  }, [user, authLoading]);

  const isActive = subscription?.status === "active" && 
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

  return {
    subscription,
    isActive,
    loading: loading || authLoading,
  };
};
