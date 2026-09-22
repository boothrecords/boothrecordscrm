import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { InviteUserButton } from '@/components/users/InviteUserModal';
import { UsersTable } from '@/components/users/UsersTable';
import type { Profile } from '@/types/database';

export default async function UsersPage() {
  const currentProfile = await requireAdmin();

  const supabase = createClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, created_at')
    .order('created_at', { ascending: true });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <InviteUserButton />
      </div>

      <UsersTable profiles={(profiles as Profile[]) ?? []} currentUserId={currentProfile.id} />
    </div>
  );
}
