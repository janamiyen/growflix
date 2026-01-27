import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserWithSubscription {
  id: string;
  email: string;
  full_name: string | null;
  whatsapp: string | null;
  subscription_status: string | null;
  expires_at: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      // Fetch profiles with subscriptions
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          whatsapp,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        setLoading(false);
        return;
      }

      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("user_id, status, expires_at");

      // Create a map of subscriptions
      const subMap = new Map(
        (subscriptions || []).map((s) => [s.user_id, s])
      );

      // We need to get emails from auth - for now use placeholder
      // In production, you'd use an edge function or admin API
      const usersWithSubs: UserWithSubscription[] = (profiles || []).map((p) => {
        const sub = subMap.get(p.id);
        return {
          id: p.id,
          email: "cargando...", // Would need edge function to get
          full_name: p.full_name,
          whatsapp: p.whatsapp,
          subscription_status: sub?.status || "none",
          expires_at: sub?.expires_at || null,
          created_at: p.created_at,
        };
      });

      setUsers(usersWithSubs);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary">Activo</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">Sin suscripción</Badge>;
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">
        Usuarios
      </h1>
      <p className="mt-2 text-muted-foreground">
        Lista de usuarios registrados
      </p>

      {/* Users Table */}
      <div className="mt-8 rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || "-"}
                  </TableCell>
                  <TableCell>
                    {user.whatsapp ? (
                      <a
                        href={`https://wa.me/${user.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {user.whatsapp}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(user.subscription_status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.expires_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
