import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

interface LessonComment {
  id: string;
  lesson_id: string;
  user_id: string;
  user_email: string;
  body: string;
  created_at: string;
}

interface LessonCommentsProps {
  lessonId: string;
}

const displayName = (email: string) => email.split("@")[0] || email;
const initial = (email: string) => (email[0] || "?").toUpperCase();

const LessonComments = ({ lessonId }: LessonCommentsProps) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  const [comments, setComments] = useState<LessonComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("lesson_comments")
        .select("id, lesson_id, user_id, user_email, body, created_at")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        toast({
          title: "No se pudieron cargar los comentarios",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setComments((data || []) as LessonComment[]);
      }
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = body.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      toast({
        title: "Comentario muy largo",
        description: "Máximo 2000 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setPosting(true);
    const { data, error } = await supabase
      .from("lesson_comments")
      .insert({
        lesson_id: lessonId,
        user_id: user.id,
        user_email: user.email ?? "anon",
        body: trimmed,
      })
      .select("id, lesson_id, user_id, user_email, body, created_at")
      .single();

    if (error) {
      toast({
        title: "No se pudo publicar",
        description: error.message,
        variant: "destructive",
      });
      setPosting(false);
      return;
    }

    setComments((prev) => [data as LessonComment, ...prev]);
    setBody("");
    setPosting(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("lesson_comments").delete().eq("id", id);

    if (error) {
      toast({
        title: "No se pudo borrar",
        description: error.message,
        variant: "destructive",
      });
      setDeletingId(null);
      return;
    }

    setComments((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  };

  const canDelete = (comment: LessonComment) =>
    isAdmin || comment.user_id === user?.id;

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Comentarios
            {!loading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({comments.length})
              </span>
            )}
          </h2>
        </div>

        {user && (
          <form onSubmit={handleSubmit} className="mt-4">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compartí tu duda, consejo o experiencia..."
              rows={3}
              maxLength={2000}
              disabled={posting}
              className="resize-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {body.length}/2000
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={posting || !body.trim()}
                className="gap-2"
              >
                {posting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Publicar
              </Button>
            </div>
          </form>
        )}

        <div className="mt-8 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Todavía no hay comentarios. Sé el primero en compartir.
            </p>
          ) : (
            comments.map((comment) => (
              <article key={comment.id} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                  {initial(comment.user_email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-medium text-foreground">
                      {displayName(comment.user_email)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                    {comment.body}
                  </p>
                  {canDelete(comment) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      {deletingId === comment.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Borrar
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default LessonComments;
