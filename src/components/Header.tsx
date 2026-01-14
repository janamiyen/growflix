const Header = () => {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - Placeholder until user provides image */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <span className="text-lg font-bold text-primary-foreground">G</span>
          </div>
          <span className="font-display text-xl font-bold text-foreground tracking-wide">
            GROWFLIX
          </span>
        </div>

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
