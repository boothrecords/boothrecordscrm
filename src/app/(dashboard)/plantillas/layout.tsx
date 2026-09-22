import { requireAdmin } from '@/lib/auth';

export default async function PlantillasLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
