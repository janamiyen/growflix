import { Instagram, Mail } from "lucide-react";
import growflixLockup from "@/assets/growflix-lockup.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Logo & Description */}
          <div className="space-y-4">
            <a href="/" className="inline-flex items-center">
              <img
                src={growflixLockup}
                alt="GROWFLIX"
                className="h-10 w-auto max-w-[220px]"
              />
            </a>
            <p className="text-sm text-muted-foreground">
              Tu academia de cultivo en constante actualización. 
              Aprendé mientras seas parte de Growflix.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-foreground">
              Navegación
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#cursos" className="transition-colors hover:text-foreground">Cursos</a>
              </li>
              <li>
                <a href="#nosotros" className="transition-colors hover:text-foreground">Nosotros</a>
              </li>
              <li>
                <a href="#contacto" className="transition-colors hover:text-foreground">Contacto</a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-foreground">
              Contacto
            </h4>
            <div className="flex items-center gap-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="mailto:hola@growflix.com"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Growflix. Todos los derechos reservados.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            Contenido educativo. Verifica la legislación local antes de cultivar.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
