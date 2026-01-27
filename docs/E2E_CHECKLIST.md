# E2E Checklist: Magic Link + Access Grants

## Flujo completo de autenticación y acceso

---

### Caso 1: Usuario NO logueado entra a /app

**Setup:**
- Cerrar sesión si hay alguna activa
- Limpiar localStorage

**Acción:**
- Navegar directamente a `/app`

**Resultado esperado:**
- Redirige automáticamente a `/acceso`

**Qué revisar si falla:**
- Verificar que `PaywallGate` está envolviendo la ruta `/app`
- Revisar `useAuth` → debe retornar `user: null` cuando no hay sesión
- Confirmar que `PaywallGate` redirige a `/acceso` cuando `!user`

---

### Caso 2: Usuario logueado SIN grant

**Setup:**
- Tener un usuario autenticado (magic link exitoso)
- NO tener registro en `access_grants` para ese email
- O tener registro con `status='revoked'` o `expires_at` pasado

**Acción:**
- Navegar a `/app`

**Resultado esperado:**
- Redirige a `/sin-acceso`
- Muestra email del usuario
- Muestra CTAs: "Ir a pagar" y "Confirmar pago"

**Qué revisar si falla:**
- Verificar `useAccessGrant` → debe retornar `hasAccess: false`
- Confirmar query: `eq('status','active')` + `gt('expires_at', now)`
- Revisar que `PaywallGate` redirige a `/sin-acceso` cuando `!hasAccess`

---

### Caso 3: Usuario envía payment_claim sin login

**Setup:**
- NO estar logueado
- Ir a `/checkout` → simular pago

**Acción:**
- Ir a `/pago`
- Completar formulario (email, WhatsApp, comprobante)
- Enviar

**Resultado esperado:**
- INSERT exitoso en `payment_claims`
- Toast de confirmación
- El claim aparece en `/admin/pagos` con status `pending`

**Qué revisar si falla:**
- Confirmar RLS de `payment_claims`: INSERT con `WITH CHECK (true)`
- Verificar que el bucket `payment-receipts` permite uploads públicos
- Revisar console para errores de storage o insert

---

### Caso 4: Admin aprueba claim

**Setup:**
- Tener un `payment_claim` pendiente
- Estar logueado como admin

**Acción:**
- Ir a `/admin/pagos`
- Click "Aprobar" en el claim
- Confirmar en el modal

**Resultado esperado:**
- `payment_claims.status` → `approved`
- Se crea/actualiza `access_grants`:
  - `email` = email normalizado (lowercase, trimmed)
  - `status` = `active`
  - `expires_at` = `now() + 30 días`
- Toast: "¡Acceso aprobado!"

**Qué revisar si falla:**
- Verificar RLS de `access_grants`: INSERT/UPDATE requiere `has_role(auth.uid(), 'admin')`
- Confirmar que el usuario logueado tiene rol `admin` en `user_roles`
- Revisar errores en console

---

### Caso 5: Usuario entra por magic link

**Setup:**
- Tener `access_grants` activo para el email
- `status = 'active'` y `expires_at > now()`

**Acción:**
- Ir a `/acceso`
- Ingresar email
- Recibir magic link por correo
- Hacer clic en el link

**Resultado esperado:**
- Redirige a `/auth/callback`
- Polling detecta sesión
- Query a `access_grants` encuentra grant válido
- Redirige a `/app`
- Header muestra "Activo hasta {fecha}"

**Qué revisar si falla:**
- Verificar `AuthCallback` polling (max 10 intentos, 500ms delay)
- Confirmar query en `AuthCallback`: `eq('status','active')` + `gt('expires_at', now)`
- Revisar RLS SELECT: debe permitir leer su propio grant por email

---

### Caso 6: Grant expirado

**Setup:**
- Tener `access_grants` con `expires_at` en el pasado
- `status = 'active'` (pero expirado)

**Acción:**
- Ir a `/acceso` → magic link → click

**Resultado esperado:**
- Redirige a `/sin-acceso`

**Qué revisar si falla:**
- Verificar query en `AuthCallback`: `gt('expires_at', new Date().toISOString())`
- Confirmar que `useAccessGrant` también valida expiry
- El RLS NO valida expiry (ownership-only), la validación es en app

---

### Caso 7: Renovación de suscripción

**Setup:**
- Usuario con `access_grants` vigente (ej: expira en 15 días, el 2025-02-15)
- Nuevo `payment_claim` pendiente para ese email

**Acción:**
- Admin aprueba el nuevo claim

**Resultado esperado:**
- `expires_at` se extiende 30 días DESDE la fecha de expiración anterior
- Si expiraba el 15/02, ahora expira el 17/03
- Toast: "¡Acceso renovado!"
- NO suma desde `now()`, suma desde `currentExpiry`

**Qué revisar si falla:**
- Revisar lógica en `AdminPayments.handleAction`:
  ```typescript
  const isRenewal = currentExpiry && currentExpiry > now;
  const base = isRenewal ? currentExpiry : now;
  ```
- Si falla, verificar que `existingGrant.expires_at` se parsea correctamente

---

## Resumen de rutas

| Ruta | Guard | Comportamiento |
|------|-------|----------------|
| `/acceso` | Ninguno | Login con magic link |
| `/auth/callback` | Ninguno | Procesa callback, valida grant, redirige |
| `/sin-acceso` | Ninguno | Pantalla para usuarios sin acceso |
| `/app` | PaywallGate | Requiere auth + grant activo |
| `/app/curso/:slug` | PaywallGate | Requiere auth + grant activo |
| `/admin/*` | AdminGate | Requiere auth + rol admin |
| `/checkout`, `/pago` | Ninguno | Flujo de pago público |

---

## Estados del PaywallGate

| Estado | Comportamiento |
|--------|----------------|
| `authLoading \|\| accessLoading` | Muestra spinner |
| `!user` | Redirige a `/acceso` |
| `user && !hasAccess` | Redirige a `/sin-acceso` |
| `user && hasAccess` | Renderiza children |

**NUNCA retorna vacío**

---

## RLS Policies (access_grants)

| Operación | Política |
|-----------|----------|
| SELECT | Usuario puede ver SU grant (email match con JWT) |
| INSERT | Solo admin |
| UPDATE | Solo admin |
| DELETE | Solo admin |

**Nota:** El SELECT solo valida ownership. La validación de `status='active'` y `expires_at > now()` ocurre en la aplicación.

---

## Notas importantes

- **NO se crean usuarios desde admin** — se crean automáticamente con magic link
- El acceso se controla 100% por `access_grants` (no por `subscriptions`)
- El email siempre se normaliza: `email.trim().toLowerCase()`
- El warning de RLS en `payment_claims` (INSERT público) es intencional
