import { siteConfig } from '@/config/site';

export function OperatorNote({ children }: { children: React.ReactNode }) {
  if (siteConfig.legalPagesReviewed) return null;
  return (
    <p className="operator-note">
      <strong>Operator review required:</strong> {children}
    </p>
  );
}
