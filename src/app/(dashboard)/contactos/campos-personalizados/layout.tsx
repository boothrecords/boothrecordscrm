import { requireAdmin } from '@/lib/auth';

export default async function CamposPersonalizadosLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
