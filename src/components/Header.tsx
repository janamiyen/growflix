import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import growflixLockup from "@/assets/growflix-lockup.png";
import { Shield, Menu, X, LogIn } from "lucide-react";

const Header = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="flex items-center px-2">
          <img
            src={growflixLockup}
            alt="GROWFLIX"
            className="h-8 w-auto"
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link to={ROUTES.COURSES} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Cursos
          </Link>
          <Link to={ROUTES.CHECKOUT} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Suscripciones
          </Link>
        </nav>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          {user && isAdmin && (
            <Link to={ROUTES.ADMIN}>
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="h-4 w-4" />
                Administrador
              </Button>
            </Link>
          )}
          {!user && (
            <Link to={ROUTES.LOGIN}>
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Iniciar sesión
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="border-t border-border/50 bg-background/95 backdrop-blur-md px-4 pb-4 pt-2 md:hidden">
          <ul className="space-y-1">
            <li>
              <Link
                to={ROUTES.COURSES}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Cursos
              </Link>
            </li>
            <li>
              <Link
                to={ROUTES.CHECKOUT}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Suscripciones
              </Link>
            </li>
            {!user && (
              <li>
                <Link
                  to={ROUTES.LOGIN}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Iniciar sesión
                </Link>
              </li>
            )}
          </ul>

          {user && isAdmin && (
            <div className="mt-3 border-t border-border/50 pt-3">
              <Link to={ROUTES.ADMIN} onClick={() => setMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Shield className="h-4 w-4" />
                  Administrador
                </Button>
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;
