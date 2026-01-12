import { useState } from "react";
import { ArrowLeft, Play, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Video {
  id: string;
  title: string;
  duration: string;
  isCompleted?: boolean;
}

interface Module {
  id: string;
  title: string;
  videos: Video[];
}

interface CoursePlayerProps {
  courseTitle: string;
  modules: Module[];
  onBack: () => void;
}

const CoursePlayer = ({ courseTitle, modules, onBack }: CoursePlayerProps) => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(
    modules[0]?.videos[0] || null
  );
  const [expandedModules, setExpandedModules] = useState<string[]>([modules[0]?.id || ""]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl font-semibold text-foreground">
            {courseTitle}
          </h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Video Player */}
        <div className="flex-1 bg-background p-4 lg:p-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-card">
            {/* Placeholder Video Player */}
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-card">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <Play className="h-10 w-10 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">
                  {selectedVideo?.title || "Selecciona un video"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedVideo?.duration}
                </p>
              </div>
            </div>
          </div>

          {/* Video Title */}
          {selectedVideo && (
            <div className="mt-4">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {selectedVideo.title}
              </h2>
            </div>
          )}
        </div>

        {/* Sidebar - Module List */}
        <aside className="w-full border-t border-border bg-card lg:w-96 lg:border-l lg:border-t-0">
          <div className="p-4">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
              Contenido del curso
            </h3>
            <div className="space-y-2">
              {modules.map((module) => (
                <div key={module.id} className="overflow-hidden rounded-lg border border-border">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="flex w-full items-center justify-between bg-secondary/50 px-4 py-3 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="font-medium text-foreground">{module.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {module.videos.length} videos
                    </span>
                  </button>

                  {/* Videos List */}
                  {expandedModules.includes(module.id) && (
                    <div className="divide-y divide-border">
                      {module.videos.map((video) => (
                        <button
                          key={video.id}
                          onClick={() => setSelectedVideo(video)}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                            selectedVideo?.id === video.id
                              ? "bg-primary/10"
                              : "hover:bg-secondary/30"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                              video.isCompleted
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {video.isCompleted ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {video.title}
                            </p>
                            <p className="text-xs text-muted-foreground">{video.duration}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayer;
