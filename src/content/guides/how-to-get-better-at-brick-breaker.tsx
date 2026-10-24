import Link from 'next/link';

export default function BrickBreakerGuide() {
  return (
    <>
      <p>
        Brick breaker games reward a skill that most players never consciously learn: <strong>aiming</strong>. It is easy to
        spend a whole game just keeping the ball alive and hoping it eventually hits the right bricks. Good players instead decide
        where the ball goes next, and that changes everything — fewer lost balls, bigger combos and much faster levels.
      </p>
      <p>
        This guide explains the techniques using our own <Link href="/games/brick-breaker/">Brick Breaker</Link>, so the numbers
        are exact, but the ideas apply to almost every game in the genre.
      </p>

      <h2 id="paddle-angles">1. Understand how the paddle aims the ball</h2>
      <p>
        In many brick breakers the paddle is not flat. Where the ball lands on it decides the direction it leaves in. Our Brick
        Breaker works like this:
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Where the ball hits the paddle</th>
              <th scope="col">Where it goes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dead center</td>
              <td>Straight up</td>
            </tr>
            <tr>
              <td>Halfway to an edge</td>
              <td>About 25° from vertical, toward that side</td>
            </tr>
            <tr>
              <td>The very edge</td>
              <td>Up to 60° from vertical — a sharp, wide shot</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        The angle depends only on the hit position, not on how the ball arrived. That means you can turn a steep incoming ball into
        a shallow outgoing one, and the other way round, simply by choosing which part of the paddle to present.
      </p>
      <div className="callout">
        <p>
          <strong>Practice drill:</strong> on the first level, try to hit the left-most column of bricks three times in a row, then
          the right-most. You will quickly feel how far off-center you need to be.
        </p>
      </div>

      <h2 id="landing-point">2. Move to the landing point, not to the ball</h2>
      <p>
        Chasing the ball means you are always late. Instead, watch the ball’s angle as it leaves the bricks and move to where it
        will come down, then make small corrections as it gets closer. With a mouse or a finger this is especially effective: the
        paddle follows your pointer immediately, so you can arrive early and then fine-tune the hit position for your next shot.
      </p>
      <p>
        Between shots, drift back toward the middle of the screen. From the center you can reach any landing point in time.
      </p>

      <h2 id="tunneling">3. Tunnel behind the wall</h2>
      <p>
        The single most powerful technique in any brick breaker is getting the ball <em>above</em> the bricks. Once it is there, it
        bounces between the ceiling and the top of the wall, breaking brick after brick without coming back down.
      </p>
      <ol>
        <li>Pick one side of the wall and aim repeatedly at the same column.</li>
        <li>Once that column is cleared, aim a shot up through the gap.</li>
        <li>Enjoy the show — and get back to the center while you wait.</li>
      </ol>
      <p>
        Levels with a pyramid or diamond shape, such as level 2 (“Pyramid”) and level 6 (“Diamond”), have open space at the
        sides that makes this even easier.
      </p>

      <h2 id="combos">4. Build combos for big scores</h2>
      <p>
        Our Brick Breaker rewards bricks broken in a chain. Every brick you break before the ball touches your paddle again is worth
        25% more than the previous one, up to triple points. A cyan brick normally worth 10 points is worth 30 at the top of a
        chain. Tunneling is the easiest way to build long chains, which is why it is good for both speed and score.
      </p>

      <h2 id="tough-bricks">5. Handle tough and steel bricks</h2>
      <ul>
        <li>
          <strong>Cyan</strong> bricks break in one hit, <strong>violet</strong> in two and <strong>pink</strong> in three.
          Damaged bricks show crack marks, so you can tell at a glance how close they are to breaking.
        </li>
        <li>
          <strong>Grey steel</strong> bricks never break and do not need to be cleared. Treat them as mirrors: they bounce the ball
          predictably, which you can use to reach awkward spots. In level 5 (“Fortress”) the steel columns protect the inner
          bricks, so the way in is through the open rows above and below.
        </li>
      </ul>

      <h2 id="power-ups">6. Use capsules wisely</h2>
      <p>Destroyed bricks occasionally drop a capsule. Catch it with your paddle to activate it:</p>
      <ul>
        <li>
          <strong>W — Wide paddle</strong> for 12 seconds. The most common capsule, and it makes everything easier.
        </li>
        <li>
          <strong>S — Slow ball</strong> for 10 seconds. Perfect for setting up a precise shot at the last few bricks.
        </li>
        <li>
          <strong>+ — Extra life</strong>, up to a maximum of five.
        </li>
      </ul>
      <p>
        Capsules fall slowly. Never abandon a ball to chase one: losing the ball also cancels any active power-up, so you would lose
        both.
      </p>

      <h2 id="last-brick">7. Finish the last stubborn brick</h2>
      <p>
        Everyone knows the feeling: one brick left and the ball keeps bouncing everywhere except at it. The fix is to change the
        angle deliberately. If the ball keeps passing to the left of the brick, hit it with a different part of the paddle to change
        its path. Small changes add up over two or three bounces. If you catch a slow-ball capsule, save your concentration for this
        moment.
      </p>

      <h2 id="controls">8. Pick the right controls for you</h2>
      <ul>
        <li>
          <strong>Mouse or trackpad:</strong> the most precise option on a computer. The paddle follows the pointer while it is over
          the game.
        </li>
        <li>
          <strong>Touch:</strong> drag anywhere on the game — you do not need to keep your finger on the paddle, so it never hides
          the ball.
        </li>
        <li>
          <strong>Keyboard:</strong> consistent and comfortable, but slower to cross the screen. Start moving early.
        </li>
      </ul>

      <h2 id="mistakes">Common mistakes and fixes</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Mistake</th>
              <th scope="col">Fix</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Losing the ball after a wide, fast rebound</td>
              <td>Return to the center between shots so every landing point is reachable.</td>
            </tr>
            <tr>
              <td>Endless bouncing without hitting bricks</td>
              <td>Change which part of the paddle you use to break the pattern.</td>
            </tr>
            <tr>
              <td>Levels taking too long</td>
              <td>Open one column and tunnel behind the wall.</td>
            </tr>
            <tr>
              <td>Losing lives to capsule chasing</td>
              <td>Only catch capsules that fall near where the ball is already going to land.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="checklist">Quick checklist</h2>
      <ol>
        <li>Choose where the ball goes; the paddle is your aim.</li>
        <li>Move to the landing point early, then fine-tune.</li>
        <li>Open a column and tunnel behind the wall.</li>
        <li>Chain bricks for combo points.</li>
        <li>Never trade the ball for a capsule.</li>
      </ol>
    </>
  );
}
