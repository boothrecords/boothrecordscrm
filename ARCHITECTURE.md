# Booth Platform — Arquitectura técnica

CRM propio de Booth para administrar bases de datos de contactos de eventos de música electrónica y enviar campañas masivas por WhatsApp (API de Meta) y correo electrónico (Resend).

## 1. Stack

| Capa | Tecnología |
|---|---|
| Frontend + backend | Next.js 14 (App Router, TypeScript) desplegado en **Vercel** |
| Base de datos, Auth, Storage | **Supabase** (Postgres + Row Level Security) |
| Repositorio / CI | **GitHub** → deploy automático a Vercel |
| WhatsApp | **Meta WhatsApp Business Cloud API** (plantillas creadas y aprobadas en Meta Business Manager, envío vía Graph API, webhook para status/replies) |
| Email | **Resend** (Broadcasts/Audiences para campañas masivas, React Email para plantillas, webhooks de apertura/clic/rebote) |
| Import de archivos | Parseo de CSV/XLSX en el servidor (`papaparse` / `xlsx`) |

## 2. Modelo de datos (Supabase / Postgres)

Una sola base de datos para Booth. Todo se segmenta con **listas** y **etiquetas**, no con tenants separados.

- **profiles** — usuarios de la plataforma (1:1 con `auth.users`), con `role` (`admin` | `user`).
- **events** — eventos de música electrónica (nombre, fecha, ciudad, estado). Un contacto puede asociarse a uno o varios eventos.
- **contacts** — ficha del contacto: nombre, email, teléfono (E.164, para WhatsApp), ciudad, país, origen, estado, `owner_id`, timestamps.
- **tags** / **contact_tags** — etiquetado libre.
- **lists** / **list_contacts** — listas personalizadas (estáticas o por filtro guardado) para agrupar contactos y usarlas como audiencia de campañas.
- **contact_events** — relación contacto↔evento (con rol: asistente, compró, lead, etc.).
- **whatsapp_templates** — cache local de las plantillas aprobadas en Meta (`meta_template_name`, idioma, categoría, variables, estado de aprobación).
- **email_templates** — plantillas de correo propias (HTML/React Email), creadas dentro de la plataforma.
- **campaigns** — campaña de tipo `whatsapp` o `email`, referencia a lista/audiencia, plantilla usada, estado (`draft`, `sending`, `sent`, `failed`), métricas agregadas.
- **campaign_recipients** — un registro por contacto por campaña: estado de envío, timestamps de entrega/apertura/clic/respuesta, error si falló.
- **imports** — historial de cargas CSV/XLSX (archivo, mapeo de columnas, filas procesadas/erróneas).

Todas las tablas con **RLS** activo: los usuarios autenticados solo acceden vía policies que verifican `profiles.role`; los `admin` tienen acceso total, los `user` según los permisos que definamos por módulo.

## 3. Módulos

1. **Contactos** — tabla con filtros (segmento, ciudad, etiquetas, origen, fecha, lista, evento — igual que la referencia de Clientify), ficha de contacto individual, listas personalizadas, importación CSV/XLSX con mapeo de columnas.
2. **Campañas**
   - *WhatsApp*: elegir plantilla aprobada en Meta + audiencia (lista/filtro) → envío por lotes contra la Cloud API, tracking de estado por destinatario vía webhook.
   - *Email*: elegir plantilla propia + audiencia → envío por Resend Broadcasts, tracking de aperturas/clics/rebotes vía webhook de Resend.
3. **Plantillas de correo** — editor propio dentro de la plataforma (guardadas como `email_templates`).
4. **Plantillas de Meta** — sincronización de las plantillas ya creadas/aprobadas en Meta Business Manager (solo lectura desde la plataforma; la creación/aprobación sigue ocurriendo en Meta).
5. **Usuarios y roles** — Admin (gestión total) y Usuario (operativo: contactos y campañas, sin acceso a configuración ni gestión de usuarios).

## 4. Flujo de una campaña

1. Se define audiencia (lista o filtro guardado).
2. Se elige plantilla (Meta aprobada, o email propia).
3. La plataforma crea `campaigns` + un `campaign_recipients` por contacto.
4. Un route handler en Next.js (o Supabase Edge Function, para volúmenes grandes) recorre los destinatarios en lotes y llama a la API de Meta / Resend.
5. Los webhooks de Meta y Resend actualizan `campaign_recipients` en tiempo real (entregado, leído, rebotado, respondido).

## 5. Próximos pasos sugeridos

1. Crear proyecto en Supabase y correr `supabase/schema.sql`.
2. Configurar variables de entorno (`.env.example`).
3. Crear cuenta y dominio verificado en Resend.
4. Configurar app de Meta (WhatsApp Business Cloud API), número de prueba y webhook.
5. Conectar el repo de GitHub a Vercel para deploy continuo.
