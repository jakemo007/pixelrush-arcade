'use client';

import { useCallback, useEffect, useState } from 'react';
import { CardTable, type PileRef, type PileSpec } from '@/games/cards/CardTable';
import { canUndo, createHistory, pushHistory, type History } from '@/games/cards/history';
import { DealIcon, UndoIcon } from '@/games/cards/icons';
import { SUIT_SYMBOL, cardName } from '@/games/cards/model';
import { formatWinStats } from '@/games/cards/stats';
import { useFinishAfter, useSolitaireSession } from '@/games/cards/useSolitaireSession';
import layout from '@/games/cards/SolitaireLayout.module.css';
import type { DomGameProps } from '@/games/dom/types';
import { randomSeed } from '@/lib/utils/random';
import {
  RUNS_TO_WIN,
  TABLEAU_COUNT,
  applyMove,
  bestDestination,
  canMove,
  canPick,
  dealBlockedReason,
  dealRow,
  dealSpider,
  dealsLeft,
  hasAnyMove,
  isWon,
  moveError,
  parsePile,
  runId,
  score,
  tableauId,
  undoTo,
  type SpiderState,
  type SuitCount,
} from './rules';

type Tone = 'info' | 'warn' | 'good';

function suitCountFor(variant: string): SuitCount {
  if (variant === '4-suits') return 4;
  if (variant === '2-suits') return 2;
  return 1;
}

export default function Spider({ host, variant, paused }: DomGameProps) {
  const suitCount = suitCountFor(variant);
  const statsVariant = suitCount === 1 ? '1-suit' : `${suitCount}-suits`;
  const [history, setHistory] = useState<History<SpiderState>>(() => createHistory(dealSpider(randomSeed(), suitCount)));
  const [message, setMessage] = useState<{ text: string; tone: Tone }>({
    text: 'Build King-to-Ace runs of one suit. Click the stock to deal a new row when you are stuck.',
    tone: 'info',
  });
  const session = useSolitaireSession(host, statsVariant, paused);
  const state = history.present;
  const won = session.over;
  const points = score(state);
  const { setHud } = host;

  useEffect(() => {
    setHud([
      { id: 'score', label: 'Score', value: String(points) },
      { id: 'runs', label: 'Runs', value: `${state.completed.length}/${RUNS_TO_WIN}` },
      { id: 'time', label: 'Time', value: session.timeText },
    ]);
  }, [setHud, points, state.completed.length, session.timeText]);

  const finish = useCallback(() => {
    host.finish({
      outcome: 'won',
      value: score(state),
      detail: `All eight runs completed in ${state.moves} moves (${session.timeText}).`,
    });
  }, [host, state, session.timeText]);
  useFinishAfter(won, finish, 700);

  const afterChange = (prev: SpiderState, next: SpiderState, text: string, sound: 'place' | 'flip') => {
    session.start();
    setHistory((h) => pushHistory(h, next));
    const newRuns = next.completed.length - prev.completed.length;
    if (isWon(next)) {
      session.win();
      setMessage({ text: 'All eight runs are complete. You win!', tone: 'good' });
      host.announce('All eight runs are complete. You win!');
      return;
    }
    let full = text;
    if (newRuns > 0) {
      const suit = next.completed[next.completed.length - 1]![0]!.suit;
      full += ` Completed a run of ${suit}: ${next.completed.length} of ${RUNS_TO_WIN}. Plus 100 points.`;
    }
    const stuck = !hasAnyMove(next);
    if (stuck) full += ' No moves or deals are left: undo or start a new game.';
    host.playSound(stuck ? 'invalid' : newRuns > 0 ? 'match' : sound);
    host.announce(full);
    setMessage({ text: full, tone: stuck ? 'warn' : newRuns > 0 ? 'good' : 'info' });
  };

  const onMove = (from: PileRef, to: string): boolean => {
    if (won) return false;
    const error = moveError(state, from, to);
    if (error) {
      host.playSound('invalid');
      host.announce(error);
      setMessage({ text: error, tone: 'warn' });
      return false;
    }
    const col = state.tableau[parsePile(from.pile)!]!;
    const moving = col[from.index]!;
    const count = col.length - from.index;
    const next = applyMove(state, from, to)!;
    const revealed = from.index > 0 && !col[from.index - 1]!.faceUp;
    afterChange(
      state,
      next,
      `Moved ${cardName(moving)}${count > 1 ? ` and ${count - 1} more` : ''} to column ${parsePile(to)! + 1}.${revealed ? ' Turned over a hidden card.' : ''}`,
      revealed ? 'flip' : 'place',
    );
    return true;
  };

  const deal = () => {
    if (won) return;
    const reason = dealBlockedReason(state);
    const next = dealRow(state);
    if (reason || !next) {
      host.playSound('invalid');
      host.announce(reason ?? 'You cannot deal now.');
      setMessage({ text: reason ?? 'You cannot deal now.', tone: 'warn' });
      return;
    }
    afterChange(state, next, `Dealt a new row. ${dealsLeft(next)} deal${dealsLeft(next) === 1 ? '' : 's'} left.`, 'flip');
  };

  const undo = () => {
    if (won || !canUndo(history)) return;
    const previous = history.past[history.past.length - 1]!;
    setHistory({ past: history.past.slice(0, -1), present: undoTo(previous, state) });
    host.playSound('select');
    host.announce('Undone. Undo costs one point.');
    setMessage({ text: 'Undone (undo costs one point, like any move).', tone: 'info' });
  };

  const autoMove = (from: PileRef): boolean => {
    if (won) return false;
    const to = bestDestination(state, from);
    return to ? onMove(from, to) : false;
  };

  const onShortcut = (key: string, focused: PileRef | null): boolean => {
    if (key === 'u' || key === 'z') {
      undo();
      return true;
    }
    if (key === 'd') {
      deal();
      return true;
    }
    if (key === 'f' && focused) {
      if (!autoMove(focused)) {
        host.playSound('invalid');
        host.announce('That run has nowhere to go.');
      }
      return true;
    }
    return false;
  };

  const blocked = dealBlockedReason(state);
  const left = dealsLeft(state);
  const runs: (PileSpec | null)[] = Array.from({ length: RUNS_TO_WIN }, (_, i) => {
    const run = state.completed[i];
    return {
      id: runId(i),
      kind: 'stack',
      cards: run ? [run[0]!] : [],
      name: `Completed run ${i + 1}`,
      placeholder: '',
    };
  });
  const stock: PileSpec = {
    id: 'stock',
    kind: 'stack',
    cards: state.stock,
    name: 'Stock',
    action: left > 0 ? `Stock: ${left} deal${left === 1 ? '' : 's'} left. ${blocked ?? 'Deal a new row of ten cards'}` : 'Stock is empty: no more deals',
    badge: left > 0 ? String(left) : undefined,
  };
  const topRow = [...runs, null, stock];
  const tableau: PileSpec[] = state.tableau.map((cards, i) => ({ id: tableauId(i), kind: 'fan', cards, name: `Column ${i + 1}`, hint: 'Any card or run can go here' }));
  const suitLabel = suitCount === 1 ? `1 suit (${SUIT_SYMBOL.spades})` : suitCount === 2 ? `2 suits (${SUIT_SYMBOL.spades}${SUIT_SYMBOL.hearts})` : '4 suits';

  return (
    <div className={layout.game}>
      <div className={layout.toolbar}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={undo} disabled={!canUndo(history) || won}>
          <UndoIcon /> Undo
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={deal} disabled={won || left === 0}>
          <DealIcon /> Deal{left > 0 ? ` (${left} left)` : ''}
        </button>
        <span className={layout.spacer} />
        <p className={layout.info}>
          {suitLabel} · {state.moves} moves
        </p>
      </div>
      <CardTable
        columns={TABLEAU_COUNT}
        topRow={topRow}
        tableau={tableau}
        version={state}
        canPick={(pile, index) => !won && canPick(state, pile, index)}
        canDrop={(from, to) => canMove(state, from, to)}
        onMove={onMove}
        onActivate={deal}
        onAutoMove={autoMove}
        onShortcut={onShortcut}
        host={host}
        disabled={paused || won}
        label="Spider solitaire table"
        theme="violet"
        heightRatio={0.15}
        keyboardHelp="Press D to deal a new row, F to move the focused run to its best column, and U to undo."
      />
      <p className={layout.status} data-tone={message.tone} aria-hidden="true">
        {message.text}
      </p>
      <div className={layout.footer}>
        <p>
          {formatWinStats(session.stats)} ({suitCount === 1 ? '1 suit' : `${suitCount} suits`})
        </p>
        <p className={layout.hideNarrow}>{blocked && left > 0 ? blocked : 'Double-click a run to move it to the best column.'}</p>
      </div>
    </div>
  );
}
