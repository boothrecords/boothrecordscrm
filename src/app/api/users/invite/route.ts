import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// Invita a un nuevo usuario a Booth por correo. Solo un admin puede invitar.
// Supabase le manda automáticamente un email con un enlace para crear su
// contraseña; el trigger `handle_new_user` crea su fila en `profiles` con
// rol "user" por defecto.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Solo un administrador puede invitar usuarios.' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const email = (body?.email ?? '').trim().toLowerCase();
  const fullName = (body?.fullName ?? '').trim();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Ingresa un correo válido.' }, { status: 400 });
  }

  const origin = request.headers.get('origin') ?? new URL(request.url).origin;
  const serviceClient = createServiceClient();

  const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/aceptar-invitacion`,
    data: fullName ? { full_name: fullName } : undefined,
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
