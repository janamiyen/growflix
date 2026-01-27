import { useEffect, useState } from "react";
import { CreditCard, Users, BookOpen, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  pendingClaims: number;
  activeSubscriptions: number;
  totalCourses: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    pendingClaims: 0,
    activeSubscriptions: 0,
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch pending claims count
      const { count: pendingClaims } = await supabase
        .from("payment_claims")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch active subscriptions count
      const { count: activeSubscriptions } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch total courses count
      const { count: totalCourses } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });

      setStats({
        pendingClaims: pendingClaims || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalCourses: totalCourses || 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Pagos pendientes",
      value: stats.pendingClaims,
      icon: CreditCard,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Suscriptores activos",
      value: stats.activeSubscriptions,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Cursos publicados",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">
        Dashboard
      </h1>
      <p className="mt-2 text-muted-foreground">
        Panel de administración de Growflix
      </p>

      {/* Stats Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ title, value, icon: Icon, color, bgColor }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${bgColor}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {loading ? "..." : value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Acciones rápidas
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/admin/pagos"
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="text-foreground">Revisar pagos pendientes</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
