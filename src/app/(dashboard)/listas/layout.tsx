import { requireAdmin } from '@/lib/auth';

export default async function ListasLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
