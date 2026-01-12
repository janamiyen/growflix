import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import CourseCard from "@/components/CourseCard";
import PremiumModal from "@/components/PremiumModal";
import CoursePlayer from "@/components/CoursePlayer";

// Import images
import heroBg from "@/assets/hero-bg.jpg";
import course1 from "@/assets/course-1.jpg";
import course2 from "@/assets/course-2.jpg";
import course3 from "@/assets/course-3.jpg";
import course4 from "@/assets/course-4.jpg";

// Course data
const courses = [
  {
    id: "1",
    title: "Fundamentos del Cultivo",
    description: "Aprende desde cero los principios esenciales del cultivo de cannabis. Desde la germinación hasta las primeras semanas de crecimiento vegetativo.",
    image: course1,
    price: 49,
    modules: 8,
    duration: "4h 30min",
  },
  {
    id: "2",
    title: "Nutrición y Alimentación",
    description: "Domina el arte de nutrir tus plantas. Entiende los macro y micronutrientes, programas de alimentación y cómo diagnosticar deficiencias.",
    image: course2,
    price: 59,
    modules: 6,
    duration: "3h 15min",
  },
  {
    id: "3",
    title: "Iluminación Avanzada",
    description: "Descubre los secretos de la iluminación para maximizar tus cosechas. LED, HPS, espectros de luz y ciclos fotoperíodicos.",
    image: course3,
    price: 69,
    modules: 5,
    duration: "2h 45min",
  },
  {
    id: "4",
    title: "Cosecha y Curado",
    description: "El arte final del cultivo. Aprende cuándo y cómo cosechar, técnicas de secado y curado para potenciar sabor y potencia.",
    image: course4,
    price: 55,
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
  const [unlockedCourseId, setUnlockedCourseId] = useState<string | null>(null);

  const handleCourseClick = (course: typeof courses[0]) => {
    if (unlockedCourseId === course.id) {
      // Course is unlocked, would navigate to player
      setSelectedCourse(course);
    } else {
      setSelectedCourse(course);
      setIsModalOpen(true);
    }
  };

  const handleUnlock = (courseId: string) => {
    // In production, this would trigger payment flow
    setUnlockedCourseId(courseId);
    setIsModalOpen(false);
  };

  // If viewing unlocked course
  if (unlockedCourseId && selectedCourse && !isModalOpen) {
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
            Cultiva con
            <span className="text-gradient-premium"> conocimiento</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-slide-up text-lg text-muted-foreground sm:text-xl" style={{ animationDelay: "0.2s" }}>
            Aprende jardinería y botánica canábica con cursos profesionales. 
            Desde principiantes hasta cultivadores avanzados.
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
              Contenido exclusivo diseñado por expertos cultivadores con años de experiencia.
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
                  isLocked={unlockedCourseId !== course.id}
                  onClick={() => handleCourseClick(course)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-t border-border bg-card py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                Paso a Paso
              </h3>
              <p className="text-muted-foreground">
                Contenido estructurado para que aprendas a tu ritmo, desde lo básico hasta técnicas avanzadas.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <span className="text-2xl">📹</span>
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                Videos HD
              </h3>
              <p className="text-muted-foreground">
                Producción profesional con demostraciones claras y detalladas de cada técnica.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                Acceso Vitalicio
              </h3>
              <p className="text-muted-foreground">
                Una vez que compras, el curso es tuyo para siempre. Incluyendo todas las actualizaciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 CannaGrow. Todos los derechos reservados.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            Contenido educativo. Verifica la legislación local antes de cultivar.
          </p>
        </div>
      </footer>

      {/* Premium Modal */}
      <PremiumModal
        course={selectedCourse}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUnlock={handleUnlock}
      />
    </div>
  );
};

export default Index;
