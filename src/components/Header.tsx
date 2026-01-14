import growflixLockup from "@/assets/growflix-lockup.png";

const Header = () => {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto grid h-16 grid-cols-3 items-center px-4">
        {/* Left: Logo container */}
        <div className="flex items-center">
          <a href="/" className="flex items-center px-2">
            <img
              src={growflixLockup}
              alt="GROWFLIX"
              className="h-8 w-auto"
            />
          </a>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden items-center justify-center gap-8 md:flex">
          <a href="#cursos" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Cursos
          </a>
          <a href="#nosotros" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Nosotros
          </a>
          <a href="#contacto" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Contacto
          </a>
        </nav>

        {/* Right: Empty */}
        <div className="flex items-center justify-end">
          {/* Reserved for future use */}
        </div>
      </div>
    </header>
  );
};

export default Header;
