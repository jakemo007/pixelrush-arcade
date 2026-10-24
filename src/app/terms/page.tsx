import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { OperatorNote } from '@/components/ui/OperatorNote';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Terms of Use',
  description: `The terms for using ${siteConfig.name} and playing its free browser games.`,
  path: '/terms/',
});

export default function TermsPage() {
  const operator = siteConfig.operatorName || 'the operator of this website';
  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Terms', path: '/terms/' },
        ]}
      />
      <div className="prose" style={{ paddingTop: 'var(--space-6)' }}>
        <h1>Terms of Use</h1>
        <p className="muted">
          Last updated: <time dateTime={siteConfig.legalLastUpdated}>{siteConfig.legalLastUpdated}</time>
        </p>
        <OperatorNote>
          these are starter terms, not legal advice, and they do not by themselves make the site compliant with any law. Have
          them reviewed for your jurisdiction, complete the bracketed items, then set <code>legalPagesReviewed</code> to{' '}
          <code>true</code> in <code>src/config/site.ts</code>.
        </OperatorNote>

        <h2 id="agreement">1. Agreement</h2>
        <p>
          {siteConfig.name} (“the site”) is operated by {operator} (“we”, “us”). By using the site you agree to these terms. If you
          do not agree, please do not use the site.
        </p>

        <h2 id="games">2. Using the games</h2>
        <p>
          The games are free to play for personal entertainment. We may change, add or remove games and features at any time, and
          we do not guarantee that the site will always be available or free of errors.
        </p>

        <h2 id="conduct">3. Acceptable use</h2>
        <p>When using the site, you agree not to:</p>
        <ul>
          <li>attempt to disrupt, overload or gain unauthorized access to the site or the systems that host it;</li>
          <li>use automated tools to access the site in a way that degrades it for others;</li>
          <li>generate artificial traffic or interact with any advertising in a misleading or automated way;</li>
          <li>copy, redistribute or republish the games, artwork or text as your own, or host copies of them elsewhere.</li>
        </ul>

        <h2 id="ip">4. Intellectual property</h2>
        <p>
          The games, artwork, sound effects, text and design of the site are original works owned by us, unless stated otherwise.
          Using the site does not give you ownership of any of them.
        </p>
        <OperatorNote>
          if you publish the source code under an open-source license, describe here what that license allows, and keep it
          consistent with the repository.
        </OperatorNote>

        <h2 id="scores">5. Scores and progress</h2>
        <p>
          Scores and daily challenge progress are stored only in your browser. They are not verified, backed up or transferable,
          and they may be lost if you clear your browser data or switch devices.
        </p>

        <h2 id="health">6. Health and safety</h2>
        <p>
          The games contain fast motion and brief flashes of light. A small number of people may experience seizures or discomfort
          when exposed to flashing lights or patterns. If you or anyone in your family has a history of epilepsy or similar
          conditions, consult a doctor before playing, and stop playing immediately if you feel unwell. The games tone down screen
          shake and flashes when your device’s “reduce motion” setting is turned on.
        </p>

        <h2 id="third-parties">7. Third-party services and links</h2>
        <p>
          The site may link to other websites and may use third-party services described in our{' '}
          <Link href="/privacy/">privacy policy</Link>. We are not responsible for the content or practices of third parties.
        </p>

        <h2 id="disclaimer">8. Disclaimer</h2>
        <p>
          The site and the games are provided “as is” and “as available”, without warranties of any kind, to the extent permitted
          by law.
        </p>

        <h2 id="liability">9. Limitation of liability</h2>
        <p>
          To the extent permitted by law, we are not liable for any indirect or consequential loss arising from your use of the
          site, including lost scores or progress.
        </p>
        <OperatorNote>have the disclaimer and limitation of liability reviewed; consumer-protection laws differ by country.</OperatorNote>

        <h2 id="changes">10. Changes to these terms</h2>
        <p>We may update these terms. The “last updated” date above shows when they last changed.</p>

        <h2 id="law">11. Governing law</h2>
        <p>These terms are governed by the laws of [jurisdiction to be completed by the operator].</p>
        <OperatorNote>replace the bracketed text with the jurisdiction that governs these terms.</OperatorNote>

        <h2 id="contact">12. Contact</h2>
        <p>
          Questions about these terms? Use the <Link href="/contact/">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
