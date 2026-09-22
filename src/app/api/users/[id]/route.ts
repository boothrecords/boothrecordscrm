import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// Confirma que quien llama está autenticado y es admin. Devuelve su userId
// para poder bloquear que un admin se quite su propio rol o se elimine a sí mismo.
async function getCallingAdminId(): Promise<{ userId: string } | { errorResponse: NextResponse }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorResponse: NextResponse.json({ error: 'No autenticado.' }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  if (profile?.role !== 'admin') {
    return {
      errorResponse: NextResponse.json(
        { error: 'Solo un administrador puede hacer esto.' },
        { status: 403 }
      ),
    };
  }

  return { userId: user.id };
}

// PATCH: editar nombre y/o rol de un usuario.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await getCallingAdminId();
  if ('errorResponse' in auth) return auth.errorResponse;

  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : undefined;
  const role = body?.role === 'admin' || body?.role === 'user' ? body.role : undefined;

  if (role !== undefined && params.id === auth.userId) {
    return NextResponse.json(
      { error: 'No puedes cambiar tu propio rol desde aquí. Pídele a otro admin que lo haga.' },
      { status: 400 }
    );
  }

  const updates: Record<string, string> = {};
  if (fullName !== undefined && fullName.length > 0) updates.full_name = fullName;
  if (role !== undefined) updates.role = role;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No hay nada para actualizar.' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient.from('profiles').update(updates).eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE: elimina al usuario de Supabase Auth (y en cascada su fila en profiles).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await getCallingAdminId();
  if ('errorResponse' in auth) return auth.errorResponse;

  if (params.id === auth.userId) {
    return NextResponse.json(
      { error: 'No puedes eliminar tu propia cuenta. Pídele a otro admin que lo haga.' },
      { status: 400 }
    );
  }

  const serviceClient = createServiceClient();
  const { error } = await serviceClient.auth.admin.deleteUser(params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
