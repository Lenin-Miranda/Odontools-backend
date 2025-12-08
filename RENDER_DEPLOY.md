# 🚀 Deploy en Render - Checklist

## ✅ Configuración Completada

### 1. Variables de Entorno Requeridas
Configurar en Render Dashboard → Environment:

```
NODE_ENV=production
PORT=3001
MONGO_URI=mongodb+srv://tu_usuario:password@cluster.mongodb.net/odontools
JWT_SECRET=tu_secret_key_muy_segura_minimo_32_caracteres
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@tudominio.com
EMAIL_TO_ADMIN=admin@tudominio.com
```

### 2. CORS Configurado
- ✅ Múltiples orígenes permitidos
- ✅ Actualizar `allowedOrigins` en `server.js` con tu URL de frontend en producción

**Actualizar línea 18 de server.js:**
```javascript
const allowedOrigins = [
  "http://localhost:3000",
  "https://tu-frontend-real.vercel.app", // 🔹 CAMBIAR ESTO
];
```

### 3. Cookies en Producción
- ✅ `sameSite: 'none'` en producción (cross-origin)
- ✅ `secure: true` solo en HTTPS
- ✅ `httpOnly: true` para seguridad

### 4. Build Command en Render
```
npm install
```

### 5. Start Command en Render
```
npm start
```

### 6. Configuración Adicional en Render

#### Health Check Path
```
/api/auth/profile
```

#### Auto-Deploy
- ✅ Activar auto-deploy desde rama `main`

#### Environment
- ✅ Node

## 📋 Pasos para Deploy

1. **Push código a GitHub**
   ```bash
   git add .
   git commit -m "Preparado para deploy en Render"
   git push origin main
   ```

2. **Crear Web Service en Render**
   - Conectar repositorio GitHub
   - Tipo: Web Service
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Configurar Variables de Entorno**
   - Copiar todas las variables del `.env`
   - Agregar en Render Dashboard

4. **Configurar MongoDB**
   - Usar MongoDB Atlas (gratis)
   - Whitelist IP: `0.0.0.0/0` (todas las IPs)
   - Copiar connection string a `MONGO_URI`

5. **Desplegar**
   - Click en "Create Web Service"
   - Esperar build (~2-3 minutos)
   - Verificar logs

## 🔍 Verificación Post-Deploy

### Test Endpoints:
```bash
# Health check
curl https://tu-api.onrender.com/api/auth/profile

# Test CORS
curl -H "Origin: https://tu-frontend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://tu-api.onrender.com/api/auth/login
```

### Logs en Tiempo Real:
```bash
# En Render Dashboard → Logs
# O CLI de Render
render logs -f
```

## ⚠️ Problemas Comunes

### 1. Error CORS
**Solución:** Agregar URL del frontend a `allowedOrigins`

### 2. Cookies no funcionan
**Solución:** Verificar:
- Frontend usa `credentials: 'include'`
- Backend tiene `sameSite: 'none'` y `secure: true`
- Ambos están en HTTPS

### 3. MongoDB Connection Error
**Solución:** 
- Verificar IP whitelist en MongoDB Atlas
- Verificar formato de `MONGO_URI`

### 4. Uploads no funcionan
**Solución:** 
- Render usa sistema de archivos efímero
- Considerar usar AWS S3, Cloudinary, o DigitalOcean Spaces

## 🔄 Updates

Para actualizar el backend:
```bash
git add .
git commit -m "Update: descripción"
git push origin main
```

Render detectará el push y redesplegará automáticamente.

## 📚 Recursos

- [Render Docs](https://render.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [SendGrid Setup](https://sendgrid.com/docs/for-developers/)
