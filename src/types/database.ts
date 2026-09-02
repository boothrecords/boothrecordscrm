// Tipos manuales de partida, alineados con supabase/schema.sql.
// Reemplazar por los tipos generados con:
//   npx supabase gen types typescript --project-id <project-id> > src/types/database.ts

export type UserRole = 'admin' | 'user';
export type ContactStatus = 'activo' | 'inactivo' | 'baja';
export type CampaignChannel = 'whatsapp' | 'email';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
export type RecipientStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'replied'
  | 'bounced'
  | 'failed'
  | 'opted_out';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  source: string | null;
  status: ContactStatus;
  whatsapp_opt_in: boolean;
  email_opt_in: boolean;
  owner_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListRecord {
  id: string;
  name: string;
  description: string | null;
  is_dynamic: boolean;
  filter_json: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export interface WhatsappTemplate {
  id: string;
  meta_template_name: string;
  meta_template_id: string | null;
  language: string;
  category: string | null;
  status: string | null;
  body_preview: string | null;
  variables: Record<string, unknown> | null;
  synced_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  list_id: string | null;
  whatsapp_template_id: string | null;
  email_template_id: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  status: RecipientStatus;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  replied_at: string | null;
}

export interface ContactFilters {
  search?: string;
  status?: ContactStatus;
  city?: string;
  country?: string;
  tagIds?: string[];
  listId?: string;
  eventId?: string;
  createdFrom?: string;
  createdTo?: string;
}
