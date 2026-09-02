# Booth Platform

CRM interno de Booth para administrar bases de datos de contactos de eventos de música electrónica y enviar campañas masivas por WhatsApp (API de Meta) y correo electrónico (Resend).

Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md) para el detalle del modelo de datos y los módulos.

## 1. Requisitos

- Node.js 20+
- Una cuenta de [Supabase](https://supabase.com)
- Una cuenta de [Resend](https://resend.com) con un dominio verificado
- Una app de Meta con acceso a la [WhatsApp Business Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- Un proyecto en [Vercel](https://vercel.com) conectado a este repositorio de GitHub

## 2. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. Ve a **SQL Editor** y pega el contenido de `supabase/schema.sql`. Ejecútalo.
3. En **Authentication → Providers**, deja activo el login por email/contraseña (o el que prefieras).
4. Crea tu primer usuario admin: regístralo desde `/login` (creará un `profile` con rol `user` automáticamente) y luego, en **Table Editor → profiles**, cambia manualmente su `role` a `admin`.
5. Copia `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` desde **Project Settings → API**.

## 3. Configurar Resend

1. Verifica el dominio de envío (ej. `bookbooth.com`) en Resend.
2. Genera un API Key y guárdalo en `RESEND_API_KEY`.
3. Define `RESEND_FROM_EMAIL`, por ejemplo `"Booth <hola@bookbooth.com>"`.

## 4. Configurar Meta WhatsApp Business Cloud API

1. Crea una app de tipo "Business" en [developers.facebook.com](https://developers.facebook.com/apps).
2. Agrega el producto **WhatsApp** y conecta (o crea) el número de teléfono de Booth.
3. Copia el `Phone number ID` → `META_WHATSAPP_PHONE_NUMBER_ID` y el token permanente del **System User** → `META_WHATSAPP_TOKEN`.
4. Crea las plantillas de mensaje en **WhatsApp Manager → Plantillas de mensajes** (categoría Marketing/Utility/Authentication) y espera su aprobación.
5. Configura el webhook apuntando a `https://<tu-dominio>/api/whatsapp/webhook`, con el `META_WEBHOOK_VERIFY_TOKEN` que definas, suscrito a los campos `messages`.

## 5. Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

## 6. Correr en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 7. Desplegar

1. Sube este proyecto a un repositorio de GitHub.
2. Importa el repo en Vercel.
3. Agrega las mismas variables de entorno de `.env.local` en **Vercel → Settings → Environment Variables**.
4. Cada push a `main` desplegará automáticamente.

## 8. Estado actual del scaffold

Ya implementado:
- Autenticación con Supabase (login, sesión protegida por middleware).
- Layout de dashboard (sidebar/topbar) con la paleta de marca.
- Módulo de Contactos: tabla con filtros, ficha de contacto, listas.
- Módulos de Campañas (WhatsApp/Email), Plantillas y Usuarios (con datos reales de Supabase).
- Rutas API: importación de contactos CSV/XLSX, envío de campañas WhatsApp (Meta Cloud API) y Email (Resend), webhook de Meta.

Pendiente para llevarlo a producción (siguientes iteraciones sugeridas):
- Formularios de creación/edición reales (alta manual de contacto, creación de listas, editor de plantillas de email, wizard de importación con mapeo de columnas en UI).
- Sincronización automática de plantillas desde la API de Meta (`GET /message_templates`).
- Envío por lotes con cola/reintentos para campañas grandes (Supabase Edge Functions o un worker en Vercel).
- Permisos finos por rol en las policies de RLS (hoy cualquier usuario autenticado tiene acceso amplio).
- Aplicar el logo y la guía de marca definitiva de Booth a la UI.
