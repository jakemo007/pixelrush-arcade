import Link from 'next/link';

export default function EndlessRunnerGuide() {
  return (
    <>
      <p>
        Endless runners look like the simplest games there are: one button, one direction, no menus. That simplicity is exactly why
        they are hard. With so few inputs, every mistake is yours, and the only way to improve is to get better at{' '}
        <strong>reading</strong> what is coming and <strong>timing</strong> your response.
      </p>
      <p>
        The tips below apply to most runners. The examples use our own game, <Link href="/games/neon-dash/">Neon Dash</Link>, because we
        can tell you exactly how it works — but the habits carry over to any game in the genre.
      </p>

      <h2 id="what-the-game-tests">1. Know what the game is actually testing</h2>
      <p>A runner tests three separate skills. When you crash, try to name which one failed:</p>
      <ul>
        <li>
          <strong>Reading:</strong> did you notice the obstacle in time and recognize what kind it was?
        </li>
        <li>
          <strong>Timing:</strong> did you press at the right moment, neither too early nor too late?
        </li>
        <li>
          <strong>Restraint:</strong> did you press when you should have done nothing at all?
        </li>
      </ul>
      <p>
        Most beginners assume they have slow reactions. Usually the real problem is reading: they look at the wrong part of the
        screen, notice hazards late and then have to rush.
      </p>

      <h2 id="look-ahead">2. Look ahead, not at your character</h2>
      <p>
        In most runners your character stays in roughly the same place on screen while the world moves past. Watching your
        character tells you almost nothing — you already know where it is. Everything you need to know arrives from the edge of
        the screen.
      </p>
      <p>
        In Neon Dash the runner is fixed near the left edge and hazards enter from the right. At the starting speed an obstacle
        takes about two seconds to travel from the right edge to your runner. Near top speed it takes under one second. Moving
        your eyes to the right-hand third of the game effectively gives you extra reaction time for free.
      </p>
      <div className="callout">
        <p>
          <strong>Try this:</strong> for one run, deliberately keep your eyes on the right side of the screen and only glance at
          the runner when it is in the air. Most players survive noticeably longer on their very next attempt.
        </p>
      </div>

      <h2 id="learn-your-jump">3. Learn your jump until you don’t have to think about it</h2>
      <p>
        Every runner has a fixed jump shape. Once you know how long you stay in the air and how far you travel, timing becomes a
        matter of recognition instead of guesswork.
      </p>
      <p>Many runners, including Neon Dash, use variable jump height:</p>
      <ul>
        <li>
          <strong>Tap</strong> for a short hop that lands quickly. In Neon Dash a tap is enough to clear a single spike.
        </li>
        <li>
          <strong>Hold</strong> for a full jump. In Neon Dash a full jump lasts about seven tenths of a second and is needed for
          tall blocks, wide spike groups and pits.
        </li>
      </ul>
      <p>
        Short hops are underrated. Because you land sooner, you are ready for the next obstacle sooner. Using a full jump for
        everything is one of the most common reasons beginners get caught by a second hazard straight after the first.
      </p>

      <h2 id="forgiveness">4. Use the forgiveness built into the game</h2>
      <p>
        Well-designed platform and runner games quietly forgive small timing errors. Two techniques are especially common, and
        knowing about them changes how you play:
      </p>
      <ul>
        <li>
          <strong>Coyote time</strong> lets you jump for a brief moment after running off a ledge. It is named after the cartoon
          coyote who hangs in mid-air before falling. In Neon Dash you get a tenth of a second after leaving the edge of a pit.
        </li>
        <li>
          <strong>Jump buffering</strong> remembers a press made slightly before you land and performs the jump the moment you
          touch the ground. Neon Dash remembers a press for just over a tenth of a second.
        </li>
      </ul>
      <p>
        Together they mean that a slightly early press is almost always safer than a slightly late one. If you are unsure, lean
        early.
      </p>

      <h2 id="restraint">5. Practice doing nothing</h2>
      <p>
        Runners love to punish reflexes. Neon Dash’s orange drones hover at head height: if you stay on the ground you run
        straight underneath, but any jump — even a tiny hop — flies into them. They first appear about 40 seconds into a run,
        after you have spent a long time jumping at everything, which is exactly when your thumb wants to keep pressing.
      </p>
      <p>
        When you see a hazard that should not be jumped, consciously relax the hand you jump with. It sounds silly, but turning
        “do nothing” into an active decision is how good players avoid these crashes.
      </p>

      <h2 id="pickups">6. Do the maths on pickups</h2>
      <p>
        Collectibles are tempting, but they are rarely worth a risk. In Neon Dash an energy shard is worth 20 points. Distance is
        worth about 15 points per second at the start of a run and roughly twice that near top speed, so a shard equals somewhere
        between half a second and a second and a half of running. A crash costs everything you would have scored from that point
        on.
      </p>
      <p>
        A simple rule: collect a pickup only if it is on the path of the jump you were going to make anyway. Some shards sit right
        at the top of a well-timed jump, so good timing collects them automatically.
      </p>

      <h2 id="rhythm">7. Reset after every landing</h2>
      <p>
        Long runs fall apart when one awkward jump makes you tense up for the next three. After each landing, take a tiny mental
        reset: eyes back to the right, hand relaxed, ready to read the next shape. Avoid “mashing” the button to feel safe —
        repeated presses make your timing worse, not better.
      </p>

      <h2 id="practice">8. Practice in short, focused sessions</h2>
      <ul>
        <li>
          <strong>Pick one focus per session</strong>, such as “short hops on single spikes” or “never jump at drones”.
        </li>
        <li>
          <strong>Stop after ten or fifteen minutes.</strong> Fatigue quietly ruins timing, and tired practice builds bad habits.
        </li>
        <li>
          <strong>Use repeatable courses.</strong> When Neon Dash is featured in the{' '}
          <Link href="/daily-challenge/">Daily Challenge</Link>, everyone gets the same course for the day, and every retry
          replays it. That makes it an ideal way to learn a tricky section.
        </li>
      </ul>

      <h2 id="setup">9. Small setup changes that help</h2>
      <ul>
        <li>
          <strong>On a phone, turn it sideways.</strong> Neon Dash is a wide game; landscape gives you a much larger view and more
          warning.
        </li>
        <li>
          <strong>On a computer, use the Space bar.</strong> It is the biggest key and the easiest to press consistently.
        </li>
        <li>
          <strong>Close busy tabs and apps</strong> if the game stutters. Smooth animation makes timing much easier to judge.
        </li>
      </ul>

      <h2 id="checklist">Quick checklist</h2>
      <ol>
        <li>Eyes on the right side of the screen.</li>
        <li>Tap for small hazards, hold for big ones.</li>
        <li>When unsure, press slightly early.</li>
        <li>Let drones pass — do nothing.</li>
        <li>Only take pickups that are on your path.</li>
        <li>Reset after every landing.</li>
      </ol>
    </>
  );
}
