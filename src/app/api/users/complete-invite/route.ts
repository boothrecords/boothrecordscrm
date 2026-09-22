import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// Después de que un usuario invitado crea su contraseña (en /aceptar-invitacion),
// guarda su nombre completo en `profiles`. Se hace con el service client porque
// un usuario normal no tiene permiso de RLS para editar su propia fila de perfil
// (eso evita que alguien se auto-asigne el rol de admin desde el cliente).
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fullName = (body?.fullName ?? '').trim();

  if (!fullName) {
    return NextResponse.json({ error: 'Escribe tu nombre completo.' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
