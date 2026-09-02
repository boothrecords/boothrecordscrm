import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import type { Contact } from '@/types/database';

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-booth-border text-sm text-booth-textMuted">
        No hay contactos que coincidan con los filtros.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-booth-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-booth-surface text-booth-textMuted">
          <tr>
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Correo</th>
            <th className="px-4 py-3 font-medium">Teléfono</th>
            <th className="px-4 py-3 font-medium">Ciudad</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Creado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-booth-border">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-booth-surface/60">
              <td className="px-4 py-3">
                <Link href={`/contactos/${contact.id}`} className="font-medium hover:text-booth-accent">
                  {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}
                </Link>
              </td>
              <td className="px-4 py-3 text-booth-textMuted">{contact.email ?? '—'}</td>
              <td className="px-4 py-3 text-booth-textMuted">{contact.phone ?? '—'}</td>
              <td className="px-4 py-3 text-booth-textMuted">{contact.city ?? '—'}</td>
              <td className="px-4 py-3">
                <Badge variant={contact.status}>{contact.status}</Badge>
              </td>
              <td className="px-4 py-3 text-booth-textMuted">
                {new Date(contact.created_at).toLocaleDateString('es-CO')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
