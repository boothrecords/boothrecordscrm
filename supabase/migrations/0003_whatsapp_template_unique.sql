-- Booth Platform — migración 0003: permite sincronizar plantillas de WhatsApp
-- desde Meta sin duplicarlas (upsert por meta_template_id).
-- Ejecutar en el SQL Editor de Supabase (una sola vez).

alter table whatsapp_templates
  add constraint whatsapp_templates_meta_template_id_key unique (meta_template_id);
