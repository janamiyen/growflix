import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, Plus, Pencil, Trash2, Upload, Loader2, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/constants";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  order: number;
  is_preview: boolean;
}

const AdminCourseEdit = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    is_preview: false,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    if (!id) return;

    // Fetch course
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (courseError || !courseData) {
      console.error("Error fetching course:", courseError);
      setLoading(false);
      return;
    }

    setCourse(courseData);

    // Fetch lessons
    const { data: lessonsData } = await supabase
      .from("lessons")
      .select("*")
      .eq("course_id", id)
      .order("order", { ascending: true });

    setLessons(lessonsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !course) return;

    setUploadingCover(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${course.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("course-covers")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("course-covers")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("courses")
        .update({ cover_image_url: urlData.publicUrl })
        .eq("id", course.id);

      if (updateError) throw updateError;

      setCourse({ ...course, cover_image_url: urlData.publicUrl });
      toast({ title: "Portada actualizada" });
    } catch (error: unknown) {
      console.error("Error uploading cover:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const openLessonDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        description: lesson.description || "",
        is_preview: lesson.is_preview,
      });
    } else {
      setEditingLesson(null);
      setLessonForm({ title: "", description: "", is_preview: false });
    }
    setVideoFile(null);
    setIsLessonDialogOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim() || !course) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      let videoUrl = editingLesson?.video_url || null;

      // Upload video if provided
      if (videoFile) {
        setUploadingVideo(true);
        const fileExt = videoFile.name.split(".").pop();
        const fileName = `${course.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("course-videos")
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;
        videoUrl = fileName;
        setUploadingVideo(false);
      }

      if (editingLesson) {
        // Update
        const { error } = await supabase
          .from("lessons")
          .update({
            title: lessonForm.title.trim(),
            description: lessonForm.description.trim() || null,
            is_preview: lessonForm.is_preview,
            video_url: videoUrl,
          })
          .eq("id", editingLesson.id);

        if (error) throw error;
        toast({ title: "Lección actualizada" });
      } else {
        // Create
        const newOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) + 1 : 0;

        const { error } = await supabase.from("lessons").insert({
          course_id: course.id,
          title: lessonForm.title.trim(),
          description: lessonForm.description.trim() || null,
          is_preview: lessonForm.is_preview,
          video_url: videoUrl,
          order: newOrder,
        });

        if (error) throw error;
        toast({ title: "Lección creada" });
      }

      fetchData();
      setIsLessonDialogOpen(false);
    } catch (error: unknown) {
      console.error("Error saving lesson:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Hubo un error al guardar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploadingVideo(false);
    }
  };

  const deleteLesson = async (lesson: Lesson) => {
    if (!confirm(`¿Eliminar "${lesson.title}"?`)) return;

    const { error } = await supabase.from("lessons").delete().eq("id", lesson.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la lección",
        variant: "destructive",
      });
    } else {
      toast({ title: "Lección eliminada" });
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Curso no encontrado</p>
        <Link to={ROUTES.ADMIN_COURSES} className="mt-4 text-primary hover:underline">
          Volver a cursos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to={ROUTES.ADMIN_COURSES}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {course.title}
          </h1>
          <p className="text-sm text-muted-foreground">/{course.slug}</p>
        </div>
      </div>

      {/* Cover Image */}
      <div className="rounded-xl border border-border bg-card p-6 mb-8">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">
          Portada del curso
        </h2>
        <div className="flex items-start gap-6">
          <div className="w-64 aspect-video rounded-lg bg-secondary overflow-hidden">
            {course.cover_image_url ? (
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Sin portada
              </div>
            )}
          </div>
          <div>
            <label htmlFor="cover-upload">
              <Button asChild variant="outline" disabled={uploadingCover}>
                <span className="cursor-pointer">
                  {uploadingCover ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Subir imagen
                </span>
              </Button>
            </label>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Recomendado: 1280x720px (16:9)
            </p>
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Lecciones
          </h2>
          <Button size="sm" onClick={() => openLessonDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva lección
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Video</TableHead>
              <TableHead>Preview</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay lecciones. Agregá la primera.
                </TableCell>
              </TableRow>
            ) : (
              lessons.map((lesson, index) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{lesson.title}</TableCell>
                  <TableCell>
                    {lesson.video_url ? (
                      <span className="text-primary">✓</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lesson.is_preview ? (
                      <span className="text-primary">Sí</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openLessonDialog(lesson)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLesson(lesson)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Editar lección" : "Nueva lección"}
            </DialogTitle>
            <DialogDescription>
              {editingLesson
                ? "Modificá los detalles de la lección"
                : "Agregá una nueva lección al curso"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="lesson-title">Título</Label>
              <Input
                id="lesson-title"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="Nombre de la lección"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="lesson-desc">Descripción</Label>
              <Textarea
                id="lesson-desc"
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                placeholder="Descripción de la lección..."
                className="mt-2"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="lesson-video">Video</Label>
              <div className="mt-2">
                <Input
                  id="lesson-video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                />
                {editingLesson?.video_url && !videoFile && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Video actual: {editingLesson.video_url}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is-preview"
                checked={lessonForm.is_preview}
                onCheckedChange={(checked) => setLessonForm({ ...lessonForm, is_preview: checked })}
              />
              <Label htmlFor="is-preview">Marcar como preview (acceso gratuito)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLesson} disabled={saving || uploadingVideo}>
              {(saving || uploadingVideo) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {uploadingVideo ? "Subiendo video..." : editingLesson ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourseEdit;
