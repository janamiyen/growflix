// Subscription pricing
export const MONTHLY_PRICE = 9999;

// MercadoPago payment link
export const MERCADOPAGO_LINK = "https://mpago.la/1yn8dAB";

// Admin WhatsApp for support
export const ADMIN_WHATSAPP = "5491165361856";

// App routes
export const ROUTES = {
  HOME: "/",
  COURSES: "/cursos",
  CHECKOUT: "/checkout",
  PAYMENT_CLAIM: "/pago",
  LOGIN: "/acceso",
  AUTH_CALLBACK: "/auth/callback",
  NO_ACCESS: "/sin-acceso",
  APP: "/app",
  COURSE_VIEW: "/app/curso",
  ADMIN: "/admin",
  ADMIN_COURSES: "/admin/cursos",
  ADMIN_PAYMENTS: "/admin/pagos",
  ADMIN_USERS: "/admin/usuarios",
  ACTIVATE: "/activar",
} as const;
