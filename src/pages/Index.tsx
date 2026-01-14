import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, ChevronDown, Crown, RefreshCw, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import PremiumModal from "@/components/PremiumModal";
import CoursePlayer from "@/components/CoursePlayer";

// Import images
import heroBg from "@/assets/hero-bg.jpg";
import course1 from "@/assets/course-1.jpg";
import course2 from "@/assets/course-2.jpg";
import course3 from "@/assets/course-3.jpg";
import course4 from "@/assets/course-4.jpg";

// Subscription price in ARS
const MONTHLY_PRICE = 9990;

// Course data
const courses = [
  {
    id: "1",
    title: "Fundamentos del Cultivo",
    description: "Aprende desde cero los principios esenciales del cultivo de cannabis. Desde la germinación hasta las primeras semanas de crecimiento vegetativo.",
    image: course1,
    price: 0, // Not used in subscription model
    modules: 8,
    duration: "4h 30min",
  },
  {
    id: "2",
    title: "Nutrición y Alimentación",
    description: "Domina el arte de nutrir tus plantas. Entiende los macro y micronutrientes, programas de alimentación y cómo diagnosticar deficiencias.",
    image: course2,
    price: 0,
    modules: 6,
    duration: "3h 15min",
  },
  {
    id: "3",
    title: "Iluminación Avanzada",
    description: "Descubre los secretos de la iluminación para maximizar tus cosechas. LED, HPS, espectros de luz y ciclos fotoperíodicos.",
    image: course3,
    price: 0,
    modules: 5,
    duration: "2h 45min",
  },
  {
    id: "4",
    title: "Cosecha y Curado",
    description: "El arte final del cultivo. Aprende cuándo y cómo cosechar, técnicas de secado y curado para potenciar sabor y potencia.",
    image: course4,
    price: 0,
    modules: 4,
    duration: "2h 00min",
  },
];

// Sample modules for player demo
const sampleModules = [
  {
    id: "m1",
    title: "Módulo 1: Introducción",
    videos: [
      { id: "v1", title: "Bienvenida al curso", duration: "5:30", isCompleted: true },
      { id: "v2", title: "Materiales necesarios", duration: "12:45", isCompleted: true },
      { id: "v3", title: "Preparando el espacio", duration: "18:20" },
    ],
  },
  {
    id: "m2",
    title: "Módulo 2: Germinación",
    videos: [
      { id: "v4", title: "Métodos de germinación", duration: "15:00" },
      { id: "v5", title: "Cuidados iniciales", duration: "10:30" },
    ],
  },
  {
    id: "m3",
    title: "Módulo 3: Fase Vegetativa",
    videos: [
      { id: "v6", title: "Trasplante y macetas", duration: "14:00" },
      { id: "v7", title: "Control de ambiente", duration: "20:15" },
      { id: "v8", title: "Técnicas de entrenamiento", duration: "25:00" },
    ],
  },
];

const Index = () => {
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleCourseClick = (course: typeof courses[0]) => {
    if (isSubscribed) {
      // User is subscribed, navigate to player
      setSelectedCourse(course);
    } else {
      setSelectedCourse(course);
      setIsModalOpen(true);
    }
  };

  const handleSubscribe = () => {
    // In production, this would trigger MercadoPago payment flow
    setIsSubscribed(true);
    setIsModalOpen(false);
  };

  // If viewing course (subscribed user)
  if (isSubscribed && selectedCourse && !isModalOpen) {
    return (
      <CoursePlayer
        courseTitle={selectedCourse.title}
        modules={sampleModules}
        onBack={() => {
          setSelectedCourse(null);
        }}
      />
    );
  }

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
            <Button variant="hero" size="xl" className="gap-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <Play className="h-5 w-5" />
              Explorar cursos
            </Button>
            <Button variant="hero-outline" size="xl" className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
              Ver demostración
            </Button>
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

      {/* Courses Section */}
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

          {/* Course Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course, index) => (
              <div
                key={course.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CourseCard
                  id={course.id}
                  title={course.title}
                  image={course.image}
                  isLocked={!isSubscribed}
                  onClick={() => handleCourseClick(course)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition - Updated for subscription model */}
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
            <Button 
              variant="premium" 
              size="xl" 
              className="mt-8 gap-2"
              onClick={() => {
                setSelectedCourse(courses[0]);
                setIsModalOpen(true);
              }}
            >
              <Crown className="h-5 w-5" />
              Comenzar ahora
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Pagá con MercadoPago. Cancelá cuando quieras.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Premium Modal */}
      <PremiumModal
        course={selectedCourse}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubscribe={handleSubscribe}
        monthlyPrice={MONTHLY_PRICE}
      />
    </div>
  );
};

export default Index;
