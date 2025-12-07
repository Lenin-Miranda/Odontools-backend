# 🍪 Sistema de Autenticación con Cookies HttpOnly

## ✅ Implementación Completa

### Backend

**Configuración actual:**

- ✅ Token JWT se envía SOLO en cookie HttpOnly
- ✅ No se envía token en respuesta JSON (eliminado localStorage)
- ✅ Middleware solo acepta cookies (sin Authorization header)
- ✅ Endpoint de logout limpia la cookie

### Seguridad Implementada

**Cookie HttpOnly configurada con:**

```javascript
{
  httpOnly: true,      // JavaScript NO puede acceder
  secure: true,        // Solo HTTPS en producción
  sameSite: 'strict',  // Protección CSRF
  maxAge: 6 días       // Expiración automática
}
```

## Uso en Frontend

### Login

```javascript
const login = async (email, password) => {
  const response = await fetch("http://localhost:3001/api/auth/login", {
    method: "POST",
    credentials: "include", // ⚠️ OBLIGATORIO
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  // Cookie guardada automáticamente por el navegador
  return data.user; // Solo devuelve info del usuario
};
```

### Requests Protegidos

```javascript
// Todas las rutas protegidas
fetch("http://localhost:3001/api/cart", {
  credentials: "include", // ⚠️ OBLIGATORIO
});

// Con axios
import axios from "axios";
const api = axios.create({
  baseURL: "http://localhost:3001/api",
  withCredentials: true, // ⚠️ OBLIGATORIO
});
```

### Logout

```javascript
const logout = async () => {
  await fetch("http://localhost:3001/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  // Cookie eliminada automáticamente
};
```

## Endpoints

| Método | Ruta               | Descripción              |
| ------ | ------------------ | ------------------------ |
| POST   | `/api/auth/login`  | Login - establece cookie |
| POST   | `/api/auth/logout` | Logout - elimina cookie  |
| GET    | `/api/cart`        | Ejemplo ruta protegida   |
| POST   | `/api/sales`       | Ejemplo ruta protegida   |

## Verificar Cookies

**Chrome DevTools:**

1. F12 → Application → Cookies
2. Buscar `token` en `localhost:3001`
3. Debe mostrar: `HttpOnly: ✓`, `Secure: ✓` (en producción)

**Firefox:**

1. F12 → Storage → Cookies
2. Verificar cookie `token`

## Producción

En `.env`:

```env
NODE_ENV=production
```

Esto activa:

- `secure: true` → Requiere HTTPS
- Cookies más restrictivas
