import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { OperatorNote } from '@/components/ui/OperatorNote';
import { GAME_IDS } from '@/config/games';
import { gameDataKey } from '@/lib/storage/game-data';
import { adsConfig, analyticsConfig } from '@/config/integrations';
import { siteConfig } from '@/config/site';
import { DAILY_HISTORY_LIMIT, DAILY_PROGRESS_KEY } from '@/lib/storage/daily-progress';
import { personalBestKey } from '@/lib/storage/high-scores';
import { SETTINGS_KEY } from '@/lib/storage/settings';
import { pageMetadata } from '@/lib/seo/metadata';
import { ACHIEVEMENTS_STORAGE_KEY } from '@/lib/progress/definitions';

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description: `What ${siteConfig.name} stores, what it does not collect, and how optional analytics and advertising are handled.`,
  path: '/privacy/',
});

export default function PrivacyPage() {
  const operator = siteConfig.operatorName || 'the operator of this website';
  const bestKeyExample = personalBestKey(GAME_IDS[0]).replace(GAME_IDS[0], '<game>');
  const gameDataExample = gameDataKey(GAME_IDS[0], 'prefs').replace(GAME_IDS[0], '<game>').replace(/prefs$/, '<name>');

  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Privacy', path: '/privacy/' },
        ]}
      />
      <div className="prose" style={{ paddingTop: 'var(--space-6)' }}>
        <h1>Privacy Policy</h1>
        <p className="muted">
          Last updated: <time dateTime={siteConfig.legalLastUpdated}>{siteConfig.legalLastUpdated}</time>
        </p>
        <OperatorNote>
          this is a starter policy describing what the code in this project does. Review it against your actual hosting, any
          services you enable and the laws that apply to you and your visitors, ideally with a qualified lawyer. Then set{' '}
          <code>legalPagesReviewed</code> to <code>true</code> in <code>src/config/site.ts</code>.
        </OperatorNote>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>Summary</h2>
          <ul style={{ marginBottom: 0 }}>
            <li>You can play without an account, and we never ask for your name, email address or other personal details.</li>
            <li>Your scores and settings are saved in your own browser and are not sent to us.</li>
            <li>
              {analyticsConfig.enabled
                ? 'We use Google Analytics to measure how the site is used (details below).'
                : 'The site does not currently use analytics.'}
            </li>
            <li>
              {adsConfig.enabled
                ? 'The site shows ads served by Google AdSense (details below).'
                : 'The site does not currently show advertising.'}
            </li>
          </ul>
        </div>

        <h2 id="who">Who runs this site</h2>
        <p>
          {siteConfig.name} is operated by {operator}. You can reach us through the <Link href="/contact/">contact page</Link>.
        </p>
        <OperatorNote>
          add the legal name of the person or business operating the site (<code>operatorName</code> in{' '}
          <code>src/config/site.ts</code>) and, where required in your jurisdiction, a postal address.
        </OperatorNote>

        <h2 id="device-storage">Information stored on your device</h2>
        <p>
          To remember your progress, the games save a small amount of data in your browser’s <strong>local storage</strong>. It
          stays on your device and is never sent to us. We do not use cookies for these features.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Storage key</th>
                <th scope="col">What it contains</th>
                <th scope="col">Why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>{bestKeyExample}</code>
                </td>
                <td>
                  Your best result for each game (score, time, moves or strokes) and when you set it. Games with difficulty
                  levels keep one best per level, under <code>{bestKeyExample}:&lt;level&gt;</code>
                </td>
                <td>To show your personal best</td>
              </tr>
              <tr>
                <td>
                  <code>{gameDataExample}</code>
                </td>
                <td>
                  Game-specific progress, such as your last chosen difficulty, win/loss statistics, the Daily Word Puzzle board
                  and streak, or which crossword puzzles you have solved
                </td>
                <td>To restore your progress and preferences in each game</td>
              </tr>
              <tr>
                <td>
                  <code>{DAILY_PROGRESS_KEY}</code>
                </td>
                <td>Your best daily-challenge score and whether you completed it, for the last {DAILY_HISTORY_LIMIT} days</td>
                <td>To show daily challenge progress</td>
              </tr>
              <tr>
                <td>
                  <code>{ACHIEVEMENTS_STORAGE_KEY}</code>
                </td>
                <td>Brick Breaker achievements earned, including their unlocked status and progress</td>
                <td>To remember achievement progress in this browser</td>
              </tr>
              <tr>
                <td>
                  <code>{SETTINGS_KEY}</code>
                </td>
                <td>Whether sound is on or off</td>
                <td>To remember your preference</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          You can delete this data at any time by clearing this site’s data in your browser settings. Private or incognito windows
          usually discard it when they close.
        </p>

        <h2 id="not-collected">Information we do not collect</h2>
        <p>
          The site has no accounts, sign-up forms, comment sections or payment features. The games do not request your location,
          camera, microphone or contacts. Your scores are not uploaded, and there are no public leaderboards.
        </p>

        <h2 id="hosting">Hosting and server logs</h2>
        <p>
          Like almost every website, this site is delivered by a hosting provider. When your browser requests a page, the
          provider’s servers may automatically process technical information such as your IP address, browser type, the page
          requested and the time of the request, to deliver the site and protect it from abuse.
        </p>
        <OperatorNote>
          name your hosting provider, link to its privacy policy and describe how long it keeps logs. Check whether its terms
          allow your intended (including commercial) use.
        </OperatorNote>

        <h2 id="analytics">Analytics</h2>
        {analyticsConfig.enabled ? (
          <>
            <p>
              We use Google Analytics 4, provided by Google, to understand how visitors use the site, for example which pages and
              games are popular. Google Analytics may collect information such as the pages you visit, how long you stay, your
              device and browser type and your approximate location derived from your IP address.
            </p>
            <p>
              The site sets Google’s consent mode defaults to <strong>{analyticsConfig.consentDefault}</strong> before the analytics
              tag loads.{' '}
              {analyticsConfig.consentDefault === 'denied'
                ? 'With consent denied, Google Analytics does not set analytics cookies; it may still send limited, cookieless measurements.'
                : 'With consent granted by default, Google Analytics may set cookies to distinguish visitors.'}
            </p>
            <p>
              Learn more in <a href="https://policies.google.com/technologies/partner-sites">how Google uses information from sites
              that use its services</a> and <a href="https://policies.google.com/privacy">Google’s privacy policy</a>. You can opt out
              with the <a href="https://tools.google.com/dlpage/gaoptout">Google Analytics opt-out browser add-on</a>.
            </p>
            <OperatorNote>
              confirm that your consent setup matches the laws that apply to your visitors. Visitors in the EEA, the UK and
              Switzerland generally require prior consent, which needs a consent management platform. None is bundled with this
              site.
            </OperatorNote>
          </>
        ) : (
          <p>
            The site does not currently use analytics or tracking tools. If that changes, this section will be updated before
            they are enabled.
          </p>
        )}

        <h2 id="advertising">Advertising</h2>
        {adsConfig.enabled ? (
          <>
            <p>
              The site displays ads provided by Google AdSense. Third-party vendors, including Google, use cookies to serve ads based
              on your previous visits to this and other websites. Google’s use of advertising cookies enables it and its partners to
              serve ads to you based on your visits to this site and/or other sites on the internet.
            </p>
            <p>
              You can opt out of personalized advertising in <a href="https://myadcenter.google.com/">Google’s My Ad Center</a>.
              You can also opt out of some third-party vendors’ use of cookies for personalized advertising at{' '}
              <a href="https://optout.aboutads.info/">aboutads.info</a>. Learn more about{' '}
              <a href="https://policies.google.com/technologies/ads">how Google uses cookies in advertising</a>.
            </p>
            <OperatorNote>
              before enabling ads for visitors in the EEA, the UK or Switzerland, Google requires a Google-certified consent
              management platform. Also review the applicable rules for any child-directed audience, and list any other ad
              vendors you enable.
            </OperatorNote>
          </>
        ) : (
          <p>
            The site does not currently show advertising. If ads are introduced, this section will describe the provider, the
            cookies involved and your choices before ads are switched on.
          </p>
        )}

        <h2 id="children">Children</h2>
        <p>
          The games are designed for a general audience and do not ask anyone, including children, for personal information.
        </p>
        <OperatorNote>
          if you expect a significant number of young players, review child-privacy laws such as COPPA in the United States
          before enabling analytics or advertising, and configure those services accordingly.
        </OperatorNote>

        <h2 id="choices">Your choices</h2>
        <ul>
          <li>Clear this site’s data in your browser to remove your saved scores and settings.</li>
          <li>Use your browser’s privacy controls to block or delete cookies and storage.</li>
          <li>
            Depending on where you live, you may have rights to access or delete personal data held about you. Because we do not
            hold accounts or scores, most data about your play exists only on your device. Contact us with any request.
          </li>
        </ul>

        <h2 id="changes">Changes to this policy</h2>
        <p>
          We will update this page when the site changes how it handles information, and revise the “last updated” date above.
        </p>

        <h2 id="contact">Contact</h2>
        <p>
          Questions about privacy? Use the <Link href="/contact/">contact page</Link>.
        </p>
      </div>
    </div>
  );
}
