# 📧 Sistema de Gestión de Ventas con Emails

## 🎯 Flujo Completo del Sistema

### 1️⃣ Cliente Crea una Orden

**Endpoint:** `POST /api/sales/`

**Flujo:**

1. Cliente agrega productos al carrito
2. Cliente va al checkout y crea la orden
3. Sistema verifica stock disponible (sin descontar)
4. Crea venta con estado `pending`
5. Vacía el carrito del cliente
6. 📧 Envía email HTML al **admin** notificando nueva orden
7. 📧 Envía email HTML al **cliente** confirmando recepción

**⚠️ IMPORTANTE:** El stock **NO** se descuenta en este paso

---

### 2️⃣ Admin Revisa y Confirma el Pedido

**Endpoint:** `PUT /api/sales/:id/status`
**Body:** `{ "status": "confirmed" }`

**Flujo:**

1. Admin revisa la orden en el dashboard
2. Admin hace clic en "Confirmar Pedido"
3. Sistema verifica stock nuevamente
4. ✅ **Descuenta el stock** de todos los productos
5. Cambia el estado a `confirmed`
6. 📧 Envía email HTML al **cliente** informando que su pedido fue confirmado

---

### 3️⃣ Admin Actualiza Estado del Envío

**Endpoint:** `PUT /api/sales/:id/status`

#### Estado: `shipped` (Enviado)

**Body:** `{ "status": "shipped" }`

- Cambia el estado a `shipped`
- NO afecta el stock

#### Estado: `delivered` (Entregado)

**Body:** `{ "status": "delivered" }`

- Cambia el estado a `delivered`
- NO afecta el stock
- Pedido completado ✅

---

### 4️⃣ Admin Cancela una Orden

**Endpoint:** `PUT /api/sales/:id/status`
**Body:** `{ "status": "cancelled" }`

**Flujo:**

1. Admin cancela el pedido
2. **Si estaba en `confirmed`:**
   - 🔄 **Restaura el stock** sumando las cantidades
3. Cambia el estado a `cancelled`
4. 📧 Envía email HTML al **cliente** informando la cancelación

---

## 📊 Estados de una Venta

```
pending → confirmed → shipped → delivered ✅
   ↓           ↓
cancelled  cancelled
```

| Estado      | Descripción                          | Stock                                   |
| ----------- | ------------------------------------ | --------------------------------------- |
| `pending`   | Orden creada, esperando confirmación | No descontado                           |
| `confirmed` | Admin confirmó, en preparación       | **✅ Descontado**                       |
| `shipped`   | Pedido enviado al cliente            | Descontado                              |
| `delivered` | Pedido entregado                     | Descontado                              |
| `cancelled` | Pedido cancelado                     | **🔄 Restaurado** (si estaba confirmed) |

---

## 📧 Emails que se Envían

### 1. Nueva Orden (Cliente → Sistema)

- **Para:** Admin
- **Asunto:** 🔔 Nueva Orden #XXXXXX - Pendiente de Confirmación
- **Contenido:** Detalles completos de la orden con botón "Ver y Confirmar Pedido"

- **Para:** Cliente
- **Asunto:** ✅ Orden Recibida #XXXXXX - Odontools
- **Contenido:** Resumen de la orden y próximos pasos

### 2. Orden Confirmada (Admin → Cliente)

- **Para:** Cliente
- **Asunto:** 🎉 Orden #XXXXXX Confirmada - En Preparación
- **Contenido:** Confirmación con barra de progreso visual

### 3. Orden Cancelada (Admin → Cliente)

- **Para:** Cliente
- **Asunto:** ❌ Orden #XXXXXX Cancelada - Odontools
- **Contenido:** Información de cancelación y reembolso

---

## 🔧 Configuración Necesaria

### Variables de Entorno (.env)

```bash
# SendGrid (para envío de emails)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=admin@odontools.com

# URL del dashboard admin (para links en emails)
ADMIN_DASHBOARD_URL=http://localhost:3000/admin
```

---

## 🚀 Uso desde el Frontend

### Crear una Orden

```javascript
POST /api/sales/
Headers: Authorization: Bearer {token}
Body: {
  "paymentMethod": "credit_card",
  "shippingAddress": "Calle 123, Ciudad, CP"
}
```

### Admin: Confirmar Orden (Descuenta Stock)

```javascript
PUT /api/sales/:id/status
Headers: Authorization: Bearer {admin_token}
Body: {
  "status": "confirmed"
}
```

### Admin: Marcar como Enviado

```javascript
PUT /api/sales/:id/status
Headers: Authorization: Bearer {admin_token}
Body: {
  "status": "shipped"
}
```

### Admin: Cancelar Orden (Restaura Stock)

```javascript
PUT /api/sales/:id/status
Headers: Authorization: Bearer {admin_token}
Body: {
  "status": "cancelled"
}
```

---

## ✅ Ventajas de este Sistema

1. **Control Total**: Admin decide cuándo descontar stock
2. **Evita Fraudes**: No se descuenta stock de órdenes falsas
3. **Gestión de Stock**: Stock se restaura automáticamente al cancelar
4. **Comunicación Clara**: Cliente recibe emails en cada etapa
5. **Profesional**: Emails HTML con diseño atractivo
6. **Trazabilidad**: Logs detallados de cada operación

---

## 🎨 Personalización de Emails

Los templates HTML están en: `/utils/emailTemplates.js`

Puedes personalizar:

- Colores (cambiar los gradientes)
- Logo (agregar tu logo)
- Textos y mensajes
- Footer con redes sociales

---

## 📱 Próximas Mejoras Sugeridas

1. **WhatsApp Opcional**: Agregar notificación rápida por WhatsApp
2. **Tracking**: Sistema de seguimiento de envío
3. **Reembolsos**: Proceso automático de reembolsos
4. **Reportes**: Dashboard con estadísticas de ventas
5. **Notificaciones Push**: Notificaciones en tiempo real

---

¡Tu sistema de ventas está listo y profesional! 🎉
