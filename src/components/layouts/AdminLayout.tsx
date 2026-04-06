import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, Users, LogOut, Home, Menu, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);

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
      {/* ===== MOBILE: Top navbar + hamburger ===== */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-border bg-card md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link to={ROUTES.ADMIN}>
            <img src={growflixLockup} alt="GROWFLIX" className="h-7 w-auto" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <nav className="border-t border-border bg-card px-4 pb-4 pt-2">
            <ul className="space-y-1">
              {navItems.map(({ to, icon: Icon, label, exact }) => (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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

            <div className="mt-3 border-t border-border pt-3 space-y-1">
              <Link to={ROUTES.HOME} onClick={() => setMenuOpen(false)}>
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
          </nav>
        )}
      </header>

      {/* ===== DESKTOP: Fixed sidebar ===== */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card md:block">
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

      {/* ===== Main Content ===== */}
      <main className="min-h-screen pt-14 p-4 md:ml-64 md:pt-0 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
