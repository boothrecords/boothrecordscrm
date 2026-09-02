const VARIANTS: Record<string, string> = {
  activo: 'bg-emerald-500/15 text-emerald-400',
  inactivo: 'bg-yellow-500/15 text-yellow-400',
  baja: 'bg-red-500/15 text-red-400',
  default: 'bg-booth-border text-booth-textMuted',
};

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: string }) {
  const classes = VARIANTS[variant] ?? VARIANTS.default;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>{children}</span>;
}
