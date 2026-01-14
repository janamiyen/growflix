import growflixLogo from "@/assets/growflix-logo.png";

const Header = () => {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <img 
            src={growflixLogo} 
            alt="GROWFLIX" 
            className="h-12 w-auto"
          />
        </a>

        {/* Nav */}
        <nav className="hidden items-center gap-8 md:flex">
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

        {/* CTA */}
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:block">¿Ya sos suscriptor?</span>
          <button className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
            Iniciar sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
