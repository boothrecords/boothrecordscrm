import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Route Handler que recibe el enlace del email de invitación de Supabase
// (?token_hash=...&type=invite&next=...), crea la sesión en el servidor con
// verifyOtp y redirige a la página donde el usuario crea su contraseña.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      const redirectTo = new URL(next, request.url);
      return NextResponse.redirect(redirectTo);
    }
  }

  const errorUrl = new URL('/login', request.url);
  errorUrl.searchParams.set('error', 'invite_link_invalid');
  return NextResponse.redirect(errorUrl);
}
