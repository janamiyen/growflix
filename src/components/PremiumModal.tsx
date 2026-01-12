import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, Play, BookOpen, Award } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  modules: number;
  duration: string;
}

interface PremiumModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (courseId: string) => void;
}

const benefits = [
  "Acceso de por vida al curso completo",
  "Videos en alta definición",
  "Actualizaciones gratuitas",
  "Soporte prioritario",
  "Certificado de finalización",
];

const PremiumModal = ({ course, isOpen, onClose, onUnlock }: PremiumModalProps) => {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden border-border bg-card p-0">
        {/* Course Image Header */}
        <div className="relative h-48 w-full">
          <img
            src={course.image}
            alt={course.title}
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, transparent 0%, hsl(var(--card)) 100%)" }}
          />
          <div className="absolute bottom-4 left-6 right-6">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold text-foreground">
                {course.title}
              </DialogTitle>
            </DialogHeader>
          </div>
        </div>

        <div className="p-6 pt-0">
          {/* Course Stats */}
          <div className="mb-6 flex gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm">{course.modules} módulos</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Play className="h-4 w-4" />
              <span className="text-sm">{course.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span className="text-sm">Certificado incluido</span>
            </div>
          </div>

          {/* Description */}
          <p className="mb-6 text-muted-foreground">
            {course.description}
          </p>

          {/* Benefits */}
          <div className="mb-6">
            <h4 className="mb-3 font-display text-lg font-semibold text-foreground">
              ¿Qué incluye?
            </h4>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Precio del curso</p>
              <p className="font-display text-3xl font-bold text-gradient-premium">
                USD ${course.price}
              </p>
            </div>
            <Button
              variant="premium"
              size="xl"
              onClick={() => onUnlock(course.id)}
              className="gap-2"
            >
              <Lock className="h-5 w-5" />
              Desbloquear curso
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
