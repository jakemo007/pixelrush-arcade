import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Contact',
  description: `How to contact ${siteConfig.name} about bugs, feedback, game ideas or privacy questions.`,
  path: '/contact/',
});

export default function ContactPage() {
  const email = siteConfig.contactEmail;
  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact/' },
        ]}
      />
      <div className="prose" style={{ paddingTop: 'var(--space-6)' }}>
        <h1>Contact</h1>
        <p className="lead">Bug reports, feedback and game ideas are all welcome.</p>

        {email ? (
          <div className="card">
            <p>
              Email: <a href={`mailto:${email}`}>{email}</a>
            </p>
            <p className="muted small" style={{ marginBottom: 0 }}>
              We read every message, but we cannot promise a reply to each one.
            </p>
          </div>
        ) : (
          <div className="notice" role="note">
            <p>
              <strong>A contact address has not been published yet.</strong> This page will show one as soon as the site operator
              sets it up.
            </p>
          </div>
        )}

        <h2>Reporting a bug</h2>
        <p>The more detail you include, the faster a problem can be fixed. Helpful information includes:</p>
        <ul>
          <li>Which game or page the problem happened on.</li>
          <li>Your device and browser, for example “iPhone 15, Safari” or “Windows laptop, Chrome”.</li>
          <li>What you expected to happen, and what happened instead.</li>
          <li>Whether it happens every time or only occasionally.</li>
        </ul>
        <p>Please do not send passwords or other sensitive personal information. We will never ask for them.</p>

        <h2>Privacy questions</h2>
        <p>
          Our <Link href="/privacy/">privacy policy</Link> explains what the site stores and why. Your scores are kept only in your
          browser, so you can delete them yourself at any time by clearing this site’s data in your browser settings.
        </p>
      </div>
    </div>
  );
}
