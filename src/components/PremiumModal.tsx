import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, BookOpen, RefreshCw, Crown } from "lucide-react";

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
  onSubscribe: () => void;
  monthlyPrice: number;
}

const benefits = [
  "Acceso ilimitado a todos los cursos",
  "Contenido actualizado mes a mes",
  "Nuevos cursos agregados regularmente",
  "Videos en alta definición",
  "Soporte prioritario de la comunidad",
];

const PremiumModal = ({ course, isOpen, onClose, onSubscribe, monthlyPrice }: PremiumModalProps) => {
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
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Actualización constante</span>
            </div>
          </div>

          {/* Description */}
          <p className="mb-6 text-muted-foreground">
            {course.description}
          </p>

          {/* Subscription Model Highlight */}
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-start gap-3">
              <Crown className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  Accedé a este curso y todos los demás con una suscripción mensual
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Una sola suscripción, acceso total a toda la academia.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-6">
            <h4 className="mb-3 font-display text-lg font-semibold text-foreground">
              ¿Qué incluye tu suscripción?
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
              <p className="text-sm text-muted-foreground">Suscripción mensual</p>
              <p className="font-display text-3xl font-bold text-primary">
                ARS ${monthlyPrice.toLocaleString('es-AR')}
                <span className="text-lg font-normal text-muted-foreground">/mes</span>
              </p>
            </div>
            <Button
              variant="premium"
              size="xl"
              onClick={onSubscribe}
              className="gap-2"
            >
              <Crown className="h-5 w-5" />
              Suscribirme ahora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
