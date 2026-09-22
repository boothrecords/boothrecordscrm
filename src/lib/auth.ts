import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

// Para usar al inicio de páginas/layouts de servidor que solo un admin puede ver.
// Si no hay sesión, manda a /login. Si hay sesión pero no es admin, manda a /.
export async function requireAdmin(): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  return profile as Profile;
}
