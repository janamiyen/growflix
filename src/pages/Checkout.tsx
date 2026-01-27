import { Button } from "@/components/ui/button";
import { Crown, ExternalLink, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { MONTHLY_PRICE, MERCADOPAGO_LINK, ROUTES } from "@/lib/constants";
import Header from "@/components/Header";

const Checkout = () => {
  const handlePayment = () => {
    window.open(MERCADOPAGO_LINK, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-lg">
          {/* Card */}
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center">
            <Crown className="mx-auto h-16 w-16 text-primary" />
            
            <h1 className="mt-6 font-display text-3xl font-bold text-foreground">
              Suscripción Growflix
            </h1>
            
            <p className="mt-4 text-muted-foreground">
              Accedé a todos los cursos, actualizaciones constantes y nueva formación cada mes.
            </p>

            {/* Price */}
            <div className="mt-8 rounded-xl bg-background/50 p-6">
              <p className="font-display text-4xl font-bold text-primary">
                ARS ${MONTHLY_PRICE.toLocaleString('es-AR')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">/mes</p>
            </div>

            {/* Benefits */}
            <ul className="mt-6 space-y-3 text-left">
              {[
                "Acceso a todos los cursos",
                "Contenido actualizado mes a mes",
                "Nuevos cursos cada mes",
                "Comunidad de cultivadores",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Payment Button */}
            <Button
              variant="premium"
              size="xl"
              className="mt-8 w-full gap-2"
              onClick={handlePayment}
            >
              <ExternalLink className="h-5 w-5" />
              Pagar con MercadoPago
            </Button>

            {/* Already paid link */}
            <Link
              to={ROUTES.PAYMENT_CLAIM}
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Ya pagué →
            </Link>

            <p className="mt-6 text-xs text-muted-foreground">
              Pago seguro vía MercadoPago. Cancelá cuando quieras.
            </p>
          </div>

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link to={ROUTES.LOGIN} className="text-primary hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
