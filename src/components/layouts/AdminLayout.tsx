import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, CreditCard, Users, LogOut, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import growflixLockup from "@/assets/growflix-lockup.png";

const navItems = [
  { to: ROUTES.ADMIN, icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: ROUTES.ADMIN_COURSES, icon: BookOpen, label: "Cursos", exact: false },
  { to: ROUTES.ADMIN_USERS, icon: Users, label: "Usuarios", exact: false },
];

const AdminLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = ROUTES.HOME;
  };

  const isActive = (path: string, exact: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to={ROUTES.ADMIN}>
            <img src={growflixLockup} alt="GROWFLIX" className="h-8 w-auto" />
          </Link>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map(({ to, icon: Icon, label, exact }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(to, exact)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 space-y-2">
          <Link to={ROUTES.HOME}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
            >
              <Home className="h-5 w-5" />
              Volver al sitio
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
