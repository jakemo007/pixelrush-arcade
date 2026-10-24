import Link from 'next/link';

export default function SpaceSurvivalGuide() {
  return (
    <>
      <p>
        In <Link href="/games/space-survival/">Space Survival</Link> your ship fires automatically. That design choice removes a
        whole layer of controls, and it means the game is really about one thing: <strong>where your ship is</strong>. Your
        position decides what you hit, what can hit you and how much room you have when something goes wrong.
      </p>
      <p>
        This guide covers positioning, every enemy type, the two pickups and how to think about score. The specific numbers come
        straight from the game’s rules.
      </p>

      <h2 id="home-position">1. Find your home position</h2>
      <p>
        Your bullets travel straight up the whole screen, so you never need to fly close to enemies to hit them. The safest place
        to spend most of a run is <strong>low and roughly central</strong>:
      </p>
      <ul>
        <li>Being low gives you the most time to see enemies and their shots coming.</li>
        <li>Being central lets you dodge left or right equally well.</li>
        <li>You can still sweep sideways to line up shots, then drift back home.</li>
      </ul>
      <p>
        Avoid hugging the bottom corners. They look safe, but they leave you only one direction to escape in.
      </p>

      <h2 id="enemies">2. Know every enemy</h2>
      <p>New enemy types unlock as the run goes on, so the first minute is the best time to settle in.</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Enemy</th>
              <th scope="col">Appears</th>
              <th scope="col">Hits</th>
              <th scope="col">Points</th>
              <th scope="col">How to handle it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Drifter (pink diamond)</td>
              <td>From the start</td>
              <td>1</td>
              <td>10</td>
              <td>Drifts down at an angle. Slide underneath and it pops instantly.</td>
            </tr>
            <tr>
              <td>Weaver (violet hexagon)</td>
              <td>After 25 s</td>
              <td>2</td>
              <td>25</td>
              <td>Sways side to side. Stay under the middle of its swing rather than chasing it.</td>
            </tr>
            <tr>
              <td>Charger (orange triangle)</td>
              <td>After 50 s</td>
              <td>1</td>
              <td>30</td>
              <td>Stops, aims, then dashes. Shoot it while it pauses or step off its line.</td>
            </tr>
            <tr>
              <td>Gunship (red octagon)</td>
              <td>After 80 s</td>
              <td>6</td>
              <td>100</td>
              <td>Strafes near the top and fires aimed orbs. Keep moving underneath it.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="chargers">3. Read the charger’s warning</h2>
      <p>
        Chargers are the enemy that ends most early runs, but they always warn you. When a charger stops, it locks on to where your
        ship is <em>at that moment</em> and draws a dashed orange line to that spot. About seven tenths of a second later it dashes
        along that line.
      </p>
      <ul>
        <li>The line points to where you were, not where you will be. Any sideways move takes you off it.</li>
        <li>A small, early sidestep is better than a big, late dodge that might put you in front of something else.</li>
        <li>Chargers only take one hit. If you are already underneath one, it often never gets to dash.</li>
      </ul>

      <h2 id="gunships">4. Take down gunships safely</h2>
      <p>
        Gunships soak up six hits and fire pink energy orbs aimed at your current position. Because the orbs are aimed, the fix is
        simple: <strong>keep moving</strong>. Strafe slowly back and forth beneath the gunship; your shots keep landing while each
        orb flies to where you used to be. Twin cannons cut the time it takes to destroy one roughly in half.
      </p>
      <p>
        Gunships only stay for a limited time before they fly away. If a gunship arrives while the screen is busy, it is fine to
        prioritize dodging and let it go.
      </p>

      <h2 id="hits">5. Use your recovery window</h2>
      <p>
        Your hull takes three hits. After each hit your ship blinks and is invulnerable for about a second and a half. Use that
        window to move to safety, not to charge forward. Once the blinking stops, the next collision counts.
      </p>

      <h2 id="pickups">6. Collect pickups at the right time</h2>
      <ul>
        <li>
          <strong>Green + (repair)</strong> restores one point of hull. Repairs only drop while your hull is damaged.
        </li>
        <li>
          <strong>Yellow 2x (twin cannons)</strong> doubles your firepower for ten seconds. A ring around your ship shows how much
          time is left.
        </li>
      </ul>
      <p>
        Pickups drift down slowly. There is almost always time to let a dangerous moment pass and then collect them.
      </p>

      <h2 id="scoring">7. Think about score the right way</h2>
      <p>
        You earn 5 points per second survived, plus points for every enemy you destroy. Survival points add up steadily, but the
        biggest single rewards are kills: one gunship is worth 100 points, the same as 20 seconds of survival. Still, a run only
        scores while you are alive, so the best strategy is to stay safe first and take kills that your position already gives you.
      </p>
      <p>
        Waves start every 30 seconds and each one is a little faster and busier, up to a fixed limit. The first 25 seconds contain
        only drifters, so that is a good time to warm up your movement.
      </p>

      <h2 id="touch">8. Touch-screen technique</h2>
      <ul>
        <li>Put your finger anywhere on the game — below the ship works well — and drag. The ship copies your finger’s movement.</li>
        <li>Use short, smooth drags. Big swipes overshoot.</li>
        <li>If you reach the edge of the screen, just keep dragging the other way; the ship responds immediately.</li>
      </ul>

      <h2 id="daily">9. Practice with the daily challenge</h2>
      <p>
        On days when Space Survival is featured in the <Link href="/daily-challenge/">Daily Challenge</Link>, every player gets the
        same sequence of enemy spawns, and every retry replays it. That makes it a great way to practice a specific wave until you
        know it.
      </p>

      <h2 id="checklist">Quick checklist</h2>
      <ol>
        <li>Stay low and central.</li>
        <li>Step off a charger’s dashed line early.</li>
        <li>Keep moving under gunships.</li>
        <li>Use the blinking window to reach safety.</li>
        <li>Survive first; take kills your position gives you.</li>
      </ol>
    </>
  );
}
