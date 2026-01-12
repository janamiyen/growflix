import { Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  image: string;
  isLocked?: boolean;
  onClick?: () => void;
}

const CourseCard = ({ id, title, image, isLocked = true, onClick }: CourseCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative aspect-[2/3] cursor-pointer overflow-hidden rounded-lg transition-all duration-500",
        "hover:scale-105 hover:z-10",
        "card-shine"
      )}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Course Image */}
      <img
        src={image}
        alt={title}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-card)" }}
      />

      {/* Premium Badge */}
      {isLocked && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          <Star className="h-3 w-3" />
          Premium
        </div>
      )}

      {/* Lock Icon */}
      {isLocked && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
            <Lock className="h-8 w-8 text-accent" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-display text-lg font-semibold text-foreground leading-tight">
          {title}
        </h3>
        {isLocked && (
          <p className="mt-1 text-sm text-muted-foreground">
            Contenido bloqueado
          </p>
        )}
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 rounded-lg border border-transparent transition-colors duration-300 group-hover:border-primary/50" />
    </div>
  );
};

export default CourseCard;
