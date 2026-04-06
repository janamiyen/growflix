import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, LogOut, Crown, Menu, X, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccessGrant } from "@/hooks/useAccessGrant";
import { useUserRole } from "@/hooks/useUserRole";
import { ROUTES } from "@/lib/constants";
import growflixLockup from "@/assets/growflix-lockup.png";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
}

const AppPage = () => {
  const { user, signOut } = useAuth();
  const { grant } = useAccessGrant();
  const { isAdmin } = useUserRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, slug, description, cover_image_url")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching courses:", error);
      } else {
        setCourses(data || []);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = ROUTES.HOME;
  };

  const formatExpiryDate = (date: string | null) => {
    if (!date) return "Sin fecha";
    return new Date(date).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to={ROUTES.APP} className="flex items-center">
            <img src={growflixLockup} alt="GROWFLIX" className="h-8 w-auto" />
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-4 md:flex">
            <div className="text-right text-sm">
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="flex items-center justify-end gap-1 text-xs text-primary">
                <Crown className="h-3 w-3" />
                Activo hasta {formatExpiryDate(grant?.expires_at || null)}
              </p>
            </div>
            {isAdmin && (
              <Link to={ROUTES.ADMIN}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
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
          <nav className="border-t border-border/50 bg-background/95 backdrop-blur-md px-4 pb-4 pt-3 md:hidden">
            <div className="mb-3 text-sm">
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="flex items-center gap-1 text-xs text-primary">
                <Crown className="h-3 w-3" />
                Activo hasta {formatExpiryDate(grant?.expires_at || null)}
              </p>
            </div>

            <div className="space-y-1 border-t border-border/50 pt-3">
              {isAdmin && (
                <Link
                  to={ROUTES.ADMIN}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Shield className="h-5 w-5" />
                  Panel Admin
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Tus cursos
        </h1>
        <p className="mt-2 text-muted-foreground">
          Accedé a todo el contenido de Growflix
        </p>

        {/* Courses Grid */}
        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              Aún no hay cursos disponibles. ¡Pronto!
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`${ROUTES.COURSE_VIEW}/${course.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
              >
                {/* Cover Image */}
                <div className="aspect-video bg-secondary">
                  {course.cover_image_url ? (
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {course.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AppPage;
