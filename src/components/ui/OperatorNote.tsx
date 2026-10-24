import { siteConfig } from '@/config/site';

/**
 * A visible reminder for the site operator inside starter legal pages.
 * Disappears once siteConfig.legalPagesReviewed is set to true.
 */
export function OperatorNote({ children }: { children: React.ReactNode }) {
  if (siteConfig.legalPagesReviewed) return null;
  return (
    <p className="operator-note">
      <strong>Operator review required:</strong> {children}
    </p>
  );
}
