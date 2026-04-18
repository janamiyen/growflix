import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Lock, ChevronDown, Crown, RefreshCw, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES, MONTHLY_PRICE } from "@/lib/constants";
import { useAccessGrant } from "@/hooks/useAccessGrant";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";

// Import fallback images
import course1 from "@/assets/course-1.jpg";
import course2 from "@/assets/course-2.jpg";
import course3 from "@/assets/course-3.jpg";
import course4 from "@/assets/course-4.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const fallbackImages = [course1, course2, course3, course4];

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasAccess } = useAccessGrant();
  const { isActive: hasSubscription } = useSubscription();
  const { isAdmin } = useUserRole();
  const hasContentAccess = hasAccess || hasSubscription || isAdmin;

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
              Nuestros Cursos
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Contenido exclusivo diseñado por expertos cultivadores. 
              Accedé a todos con tu suscripción mensual.
            </p>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-card" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                Próximamente nuevos cursos. ¡Suscribite para ser el primero en acceder!
              </p>
              <Link to={ROUTES.CHECKOUT}>
                <Button variant="premium" className="mt-6 gap-2">
                  <Crown className="h-5 w-5" />
                  Suscribite ahora
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((course, index) => (
                <div
                  key={course.id}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                >
                  {/* Cover Image */}
                  <div className="aspect-video bg-secondary overflow-hidden">
                    <img
                      src={course.cover_image_url || fallbackImages[index % 4]}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="text-center">
                        {hasContentAccess ? (
                          <>
                            <Play className="mx-auto h-8 w-8 text-primary" />
                            <p className="mt-2 text-sm font-medium text-foreground">
                              Ver curso
                            </p>
                          </>
                        ) : (
                          <>
                            <Lock className="mx-auto h-8 w-8 text-primary" />
                            <p className="mt-2 text-sm font-medium text-foreground">
                              Solo para suscriptores
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2">
                        {course.title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                        Premium
                      </span>
                    </div>
                    {course.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {course.description}
                      </p>
                    )}
                  </div>

                  {/* CTA on hover */}
                  <Link
                    to={
                      hasContentAccess
                        ? `${ROUTES.COURSE_VIEW}/${course.slug}`
                        : ROUTES.CHECKOUT
                    }
                    className="absolute inset-0"
                    aria-label={`Ver ${course.title}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Una academia viva
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Con tu suscripción, accedés a una plataforma en constante evolución.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                Acceso Total
              </h3>
              <p className="text-muted-foreground">
                Una sola suscripción te da acceso a todos los cursos de la plataforma, sin límites.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <RefreshCw className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                Contenido Actualizado
              </h3>
              <p className="text-muted-foreground">
                Nuevos cursos y actualizaciones mes a mes. Siempre tendrás contenido fresco.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                Comunidad Activa
              </h3>
              <p className="text-muted-foreground">
                Aprendé mientras seas parte de Growflix. Comunidad de cultivadores que crecen juntos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription CTA — oculto para usuarios con acceso */}
      {!hasContentAccess && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center sm:p-12">
              <Crown className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-6 font-display text-3xl font-bold text-foreground">
                Suscribite a Growflix
              </h2>
              <p className="mt-4 text-muted-foreground">
                Accedé a todos los cursos, actualizaciones constantes y nueva formación cada mes.
              </p>
              <div className="mt-6">
                <p className="font-display text-4xl font-bold text-primary">
                  ARS ${MONTHLY_PRICE.toLocaleString('es-AR')}
                  <span className="text-lg font-normal text-muted-foreground">/mes</span>
                </p>
              </div>
              <Link to={ROUTES.CHECKOUT}>
                <Button variant="premium" size="xl" className="mt-8 gap-2">
                  <Crown className="h-5 w-5" />
                  Comenzar ahora
                </Button>
              </Link>
              <p className="mt-4 text-xs text-muted-foreground">
                Pagá con MercadoPago. Cancelá cuando quieras.
              </p>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Courses;
