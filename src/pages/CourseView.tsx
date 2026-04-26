import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Play, CheckCircle, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/constants";
import growflixLockup from "@/assets/growflix-lockup.png";
import LessonComments from "@/components/LessonComments";

const CONGRATS_MESSAGES = [
  "¡Muy bien! Ya casi estás en modo experto 🌱",
  "¡Genial! Otra lección menos, dale que vas 🚀",
  "¡Crack! Vas a salir hecho/a un/a profesional",
  "¡Bien ahí! Cada video te suma un nivel 🔥",
  "¡Excelente! Seguí así que estás re bien encaminado/a",
  "¡Imparable! Una menos, las que faltan no saben lo que les espera",
  "¡Lo lograste! Estás más cerca de dominarlo todo 💪",
];

const pickCongratsMessage = () =>
  CONGRATS_MESSAGES[Math.floor(Math.random() * CONGRATS_MESSAGES.length)];

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  order: number;
  is_preview: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

const CourseView = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCourse = async () => {
      if (!slug) return;

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, title, description, cover_image_url")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (courseError || !courseData) {
        console.error("Error fetching course:", courseError);
        setLoading(false);
        return;
      }

      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, title, description, video_url, order, is_preview")
        .eq("course_id", courseData.id)
        .order("order", { ascending: true });

      if (lessonsError) {
        console.error("Error fetching lessons:", lessonsError);
      } else {
        setLessons(lessonsData || []);
        if (lessonsData && lessonsData.length > 0) {
          setCurrentLesson(lessonsData[0]);
        }
      }

      setLoading(false);
    };

    fetchCourse();
  }, [slug]);

  // Load completed lesson ids for the current user + course
  useEffect(() => {
    const loadProgress = async () => {
      if (!user || lessons.length === 0) return;

      const lessonIds = lessons.map((l) => l.id);
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds);

      if (error) {
        console.error("Error fetching progress:", error);
        return;
      }

      setCompletedIds(new Set((data || []).map((row) => row.lesson_id)));
    };

    loadProgress();
  }, [user, lessons]);

  const handleVideoEnded = async () => {
    if (!user || !currentLesson) return;
    if (completedIds.has(currentLesson.id)) return;

    const { error } = await supabase
      .from("lesson_progress")
      .insert({ user_id: user.id, lesson_id: currentLesson.id });

    if (error && error.code !== "23505") {
      console.error("Error saving progress:", error);
      return;
    }

    setCompletedIds((prev) => new Set(prev).add(currentLesson.id));
    toast({
      title: pickCongratsMessage(),
      description: `Terminaste "${currentLesson.title}"`,
    });
  };

  // Get signed URL for video
  useEffect(() => {
    const getVideoUrl = async () => {
      if (!currentLesson?.video_url) {
        setVideoUrl(null);
        return;
      }

      // If it's an external URL, use it directly
      if (currentLesson.video_url.startsWith("http")) {
        setVideoUrl(currentLesson.video_url);
        return;
      }

      // Get signed URL from storage
      const { data } = await supabase.storage
        .from("course-videos")
        .createSignedUrl(currentLesson.video_url, 3600);

      setVideoUrl(data?.signedUrl || null);
    };

    getVideoUrl();
  }, [currentLesson]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground">Curso no encontrado</p>
        <Link to={ROUTES.APP} className="mt-4 text-primary hover:underline">
          Volver a cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to={ROUTES.APP}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <img src={growflixLockup} alt="GROWFLIX" className="hidden h-6 w-auto sm:block" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <div className="flex flex-col lg:flex-row">
          {/* Video Player */}
          <div className="flex-1">
            <div className="aspect-video bg-black">
              {videoUrl ? (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  className="h-full w-full"
                  autoPlay
                  onEnded={handleVideoEnded}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Play className="mx-auto h-16 w-16 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">
                      {currentLesson ? "Video no disponible" : "Seleccioná una lección"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Info */}
            <div className="p-6">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {currentLesson?.title || course.title}
              </h1>
              {currentLesson?.description && (
                <p className="mt-4 text-muted-foreground">{currentLesson.description}</p>
              )}
            </div>

            {currentLesson && <LessonComments lessonId={currentLesson.id} />}
          </div>

          {/* Lessons Sidebar */}
          <div className="w-full border-t border-border lg:w-96 lg:border-l lg:border-t-0">
            <div className="p-4">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {course.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {completedIds.size} de {lessons.length} lecciones completadas
              </p>
              {lessons.length > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(completedIds.size / lessons.length) * 100}%` }}
                  />
                </div>
              )}
            </div>

            <div className="divide-y divide-border">
              {lessons.map((lesson, index) => {
                const isCompleted = completedIds.has(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLesson(lesson)}
                    className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-secondary/50 ${
                      currentLesson?.id === lesson.id ? "bg-secondary" : ""
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        isCompleted
                          ? "bg-green-500/20 text-green-500"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          isCompleted ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {lesson.title}
                      </p>
                      {lesson.is_preview && !isCompleted && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                          <CheckCircle className="h-3 w-3" />
                          Preview
                        </span>
                      )}
                      {isCompleted && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs text-green-500">
                          Completada
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseView;
