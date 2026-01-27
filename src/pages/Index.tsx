import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, ChevronDown, Crown, RefreshCw, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ROUTES, MONTHLY_PRICE } from "@/lib/constants";

// Import images
import heroBg from "@/assets/hero-bg.jpg";
import course1 from "@/assets/course-1.jpg";
import course2 from "@/assets/course-2.jpg";
import course3 from "@/assets/course-3.jpg";
import course4 from "@/assets/course-4.jpg";

// Course preview data for landing
const coursePreviews = [
  {
    id: "1",
    title: "Fundamentos del Cultivo",
    image: course1,
  },
  {
    id: "2",
    title: "Nutrición y Alimentación",
    image: course2,
  },
  {
    id: "3",
    title: "Iluminación Avanzada",
    image: course3,
  },
  {
    id: "4",
    title: "Cosecha y Curado",
    image: course4,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt="Cannabis cultivation"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "var(--gradient-hero)" }}
          />
          <div className="absolute inset-0 bg-background/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <h1 className="animate-fade-in font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Aprendé a cultivar
            <span className="text-primary"> como un experto</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-slide-up text-lg text-muted-foreground sm:text-xl" style={{ animationDelay: "0.2s" }}>
            Accedé a todos los cursos con una suscripción mensual. 
            Contenido actualizado, nuevos cursos cada mes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row" style={{ animationDelay: "0.4s" }}>
            <Link to={ROUTES.CHECKOUT}>
              <Button variant="hero" size="xl" className="gap-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <Play className="h-5 w-5" />
                Comenzar ahora
              </Button>
            </Link>
            <Link to={ROUTES.COURSES}>
              <Button variant="hero-outline" size="xl" className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
                Explorar cursos
              </Button>
            </Link>
          </div>

          {/* Subscription Badge */}
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-foreground animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <Crown className="h-4 w-4 text-primary" />
            <span>Una sola suscripción, acceso total</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-muted-foreground" />
        </div>
      </section>

      {/* Courses Preview Section */}
      <section id="cursos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Nuestros Cursos
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Contenido exclusivo diseñado por expertos cultivadores. 
              Accedé a todos con tu suscripción.
            </p>
          </div>

          {/* Course Grid Preview */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coursePreviews.map((course, index) => (
              <Link
                key={course.id}
                to={ROUTES.CHECKOUT}
                className="group animate-fade-in overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2">
                      {course.title}
                    </h3>
                    <span className="shrink-0 rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                      Premium
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to={ROUTES.COURSES}>
              <Button variant="outline" size="lg">
                Ver todos los cursos
              </Button>
            </Link>
          </div>
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

      {/* Subscription CTA Section */}
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

      <Footer />
    </div>
  );
};

export default Index;
