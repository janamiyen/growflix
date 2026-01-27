# E2E Checklist: Magic Link + Access Grants

## Flujo completo de autenticación y acceso

### Test 1: Usuario sin grant intenta acceder
1. Ir a `/acceso`
2. Ingresar email SIN grant existente
3. Recibir magic link por email
4. Hacer clic en el link
5. **Esperado:** Redirige a `/sin-acceso`

### Test 2: Crear claim y aprobar
1. Ir a `/checkout` → click en link MercadoPago (simular pago)
2. Ir a `/pago` → completar formulario con email y WhatsApp
3. Verificar que se creó el `payment_claim` con status `pending`
4. Ir a `/admin/pagos` (como admin)
5. Aprobar el claim
6. **Esperado:** Se crea/actualiza `access_grants` con:
   - `email` = email normalizado (lowercase, trimmed)
   - `status` = 'active'
   - `expires_at` = now() + 30 días

### Test 3: Usuario con grant activo accede
1. Ir a `/acceso`
2. Ingresar email CON grant activo
3. Recibir magic link
4. Hacer clic en el link
5. **Esperado:** Redirige a `/app`

### Test 4: Grant expirado
1. Manualmente en DB: actualizar `expires_at` a fecha pasada
2. Ir a `/acceso` → magic link → click
3. **Esperado:** Redirige a `/sin-acceso`

### Test 5: Renovación de suscripción
1. Usuario con grant vigente (ej: expira en 15 días)
2. Admin aprueba nuevo claim para ese email
3. **Esperado:** `expires_at` se extiende 30 días DESDE la fecha de expiración anterior (no desde now)
   - Si expiraba el 15/02, ahora expira el 17/03

### Test 6: Grant revocado
1. Manualmente: cambiar `status` a 'revoked' en DB
2. Usuario intenta magic link
3. **Esperado:** Redirige a `/sin-acceso`

## Rutas protegidas

| Ruta | Guard | Comportamiento |
|------|-------|----------------|
| `/app` | PaywallGate | Requiere auth + grant activo |
| `/app/curso/:slug` | PaywallGate | Requiere auth + grant activo |
| `/admin/*` | AdminGate | Requiere auth + rol admin |

## Estados del PaywallGate

1. Loading → Muestra spinner
2. No user → Redirige a `/acceso`
3. User sin grant → Redirige a `/sin-acceso`
4. User con grant activo → Muestra contenido

## Notas importantes

- **NO se crean usuarios desde admin**
- Los usuarios se crean automáticamente al usar magic link por primera vez
- El acceso se controla 100% por `access_grants` (no por `subscriptions`)
- El email siempre se normaliza: `email.trim().toLowerCase()`
