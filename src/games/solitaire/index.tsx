'use client';

import { useCallback, useEffect, useState } from 'react';
import { CardTable, type PileRef, type PileSpec } from '@/games/cards/CardTable';
import { canUndo, createHistory, pushHistory, undoHistory, type History } from '@/games/cards/history';
import { RecycleIcon, SparkIcon, UndoIcon } from '@/games/cards/icons';
import { cardName, top } from '@/games/cards/model';
import { formatWinStats } from '@/games/cards/stats';
import { useFinishAfter, useSolitaireSession } from '@/games/cards/useSolitaireSession';
import layout from '@/games/cards/SolitaireLayout.module.css';
import { useInterval } from '@/games/dom/hooks';
import type { DomGameProps, SoundCue } from '@/games/dom/types';
import { randomSeed } from '@/lib/utils/random';
import {
  FOUNDATION_COUNT,
  applyMove,
  autoMoveTarget,
  canAutoComplete,
  canMove,
  canPick,
  dealKlondike,
  drawFromStock,
  foundationId,
  isWon,
  moveError,
  nextAutoCompleteMove,
  parsePile,
  pileCards,
  revealsCard,
  tableauId,
  type KlondikeState,
} from './rules';

type Tone = 'info' | 'warn' | 'good';

function pileName(pile: string): string {
  const p = parsePile(pile);
  if (!p) return pile;
  if (p.kind === 'tableau') return `column ${p.index + 1}`;
  if (p.kind === 'foundation') return `foundation ${p.index + 1}`;
  return p.kind;
}

export default function Klondike({ host, variant, paused }: DomGameProps) {
  const drawCount = variant === 'draw-3' ? 3 : 1;
  const statsVariant = drawCount === 3 ? 'draw-3' : 'draw-1';
  const [history, setHistory] = useState<History<KlondikeState>>(() => createHistory(dealKlondike(randomSeed(), drawCount)));
  const [message, setMessage] = useState<{ text: string; tone: Tone }>({
    text: drawCount === 3 ? 'Draw three: click the stock to turn over three cards.' : 'Click the stock to turn over a card.',
    tone: 'info',
  });
  const [autoRunning, setAutoRunning] = useState(false);
  const session = useSolitaireSession(host, statsVariant, paused);
  const state = history.present;
  const won = session.over;
  const { setHud } = host;

  useEffect(() => {
    setHud([
      { id: 'moves', label: 'Moves', value: String(state.moves) },
      { id: 'time', label: 'Time', value: session.timeText },
    ]);
  }, [setHud, state.moves, session.timeText]);

  const finish = useCallback(() => {
    host.finish({
      outcome: 'won',
      value: session.winTime ?? undefined,
      detail: `Solved in ${state.moves} moves${state.recycles > 0 ? `, ${state.recycles + 1} passes through the stock` : ''}.`,
    });
  }, [host, session.winTime, state.moves, state.recycles]);
  useFinishAfter(won, finish, 650);

  const commit = (next: KlondikeState, sound: SoundCue, text: string) => {
    session.start();
    setHistory((h) => pushHistory(h, next));
    if (isWon(next)) {
      session.win();
      setAutoRunning(false);
      setMessage({ text: 'All four foundations are complete. You win!', tone: 'good' });
      host.announce('All cards are on the foundations. You win!');
      return;
    }
    host.playSound(sound);
    setMessage({ text, tone: 'info' });
    host.announce(text);
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
    const moving = pileCards(state, from.pile)[from.index]!;
    const reveals = revealsCard(state, from);
    const next = applyMove(state, from, to)!;
    const revealed = reveals ? top(pileCards(next, from.pile)) : undefined;
    const count = pileCards(state, from.pile).length - from.index;
    let text = `Moved ${cardName(moving)}${count > 1 ? ` and ${count - 1} more` : ''} to ${pileName(to)}.`;
    if (revealed) text += ` Turned over the ${cardName(revealed)}.`;
    const sound: SoundCue = parsePile(to)?.kind === 'foundation' ? 'match' : revealed ? 'flip' : 'place';
    commit(next, sound, text);
    return true;
  };

  const draw = () => {
    if (won) return;
    const next = drawFromStock(state);
    if (!next) {
      host.playSound('invalid');
      const text = 'The stock and the waste are both empty.';
      host.announce(text);
      setMessage({ text, tone: 'warn' });
      return;
    }
    if (state.stock.length === 0) {
      commit(next, 'flip', 'Turned the waste back over to make a new stock.');
      return;
    }
    const drawn = next.waste.slice(state.waste.length);
    const shown = top(next.waste)!;
    commit(next, 'flip', drawn.length > 1 ? `Drew ${drawn.length} cards. ${cardName(shown)} is on top.` : `Drew the ${cardName(shown)}.`);
  };

  const undo = () => {
    if (won || autoRunning || !canUndo(history)) return;
    setHistory(undoHistory(history));
    host.playSound('select');
    host.announce('Move undone.');
    setMessage({ text: 'Move undone.', tone: 'info' });
  };

  const autoMove = (from: PileRef): boolean => {
    if (won) return false;
    const to = autoMoveTarget(state, from);
    return to ? onMove(from, to) : false;
  };

  const autoStep = () => {
    const m = nextAutoCompleteMove(history.present);
    if (!m) {
      setAutoRunning(false);
      return;
    }
    const next = applyMove(history.present, m.from, m.to);
    if (!next) {
      setAutoRunning(false);
      return;
    }
    session.start();
    setHistory((h) => pushHistory(h, next));
    if (isWon(next)) {
      session.win();
      setAutoRunning(false);
      setMessage({ text: 'All four foundations are complete. You win!', tone: 'good' });
      host.announce('All cards are on the foundations. You win!');
    } else {
      host.playSound('place');
    }
  };
  useInterval(autoStep, 70, autoRunning && !paused && !won);

  const startAutoComplete = () => {
    if (!canAutoComplete(state) || autoRunning) return;
    host.announce('Auto-completing: moving every card to the foundations.');
    if (host.reducedMotion) {
      let cur = state;
      let h = history;
      for (let m = nextAutoCompleteMove(cur); m; m = nextAutoCompleteMove(cur)) {
        const next = applyMove(cur, m.from, m.to);
        if (!next) break;
        h = pushHistory(h, next);
        cur = next;
      }
      session.start();
      setHistory(h);
      if (isWon(cur)) {
        session.win();
        setMessage({ text: 'All four foundations are complete. You win!', tone: 'good' });
      }
      return;
    }
    setAutoRunning(true);
  };

  const onShortcut = (key: string, focused: PileRef | null): boolean => {
    if (key === 'u' || key === 'z') {
      undo();
      return true;
    }
    if (key === 'd') {
      draw();
      return true;
    }
    if (key === 'a' && canAutoComplete(state)) {
      startAutoComplete();
      return true;
    }
    if (key === 'f' && focused) {
      if (!autoMove(focused)) {
        host.playSound('invalid');
        host.announce('That card cannot go to a foundation yet.');
      }
      return true;
    }
    return false;
  };

  const stockAction =
    state.stock.length > 0
      ? `Stock, ${state.stock.length} cards. Draw ${drawCount === 3 ? 'three cards' : 'a card'}`
      : state.waste.length > 0
        ? 'Stock is empty. Turn the waste back over'
        : 'Stock and waste are empty';

  const stock: PileSpec = {
    id: 'stock',
    kind: 'stack',
    cards: state.stock,
    name: 'Stock',
    action: stockAction,
    placeholder: state.waste.length > 0 ? <RecycleIcon /> : undefined,
    badge: state.stock.length > 0 ? String(state.stock.length) : undefined,
  };
  const waste: PileSpec = { id: 'waste', kind: 'waste', cards: state.waste, name: 'Waste', spread: drawCount, span: drawCount === 3 ? 2 : 1 };
  const foundations: PileSpec[] = Array.from({ length: FOUNDATION_COUNT }, (_, i) => ({
    id: foundationId(i),
    kind: 'stack',
    cards: state.foundations[i]!,
    name: `Foundation ${i + 1}`,
    placeholder: 'A',
    hint: 'Start it with any Ace',
  }));
  const topRow: (PileSpec | null)[] = [stock, waste, null, ...foundations];
  const tableau: PileSpec[] = state.tableau.map((cards, i) => ({
    id: tableauId(i),
    kind: 'fan',
    cards,
    name: `Column ${i + 1}`,
    placeholder: 'K',
    hint: 'Only a King can go here',
  }));

  const offerAuto = canAutoComplete(state) && !won;

  return (
    <div className={layout.game}>
      <div className={layout.toolbar}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={undo} disabled={!canUndo(history) || won || autoRunning}>
          <UndoIcon /> Undo
        </button>
        {offerAuto && (
          <button type="button" className="btn btn-primary btn-sm" onClick={startAutoComplete} disabled={autoRunning}>
            <SparkIcon /> {autoRunning ? 'Finishing…' : 'Auto-complete'}
          </button>
        )}
        <span className={layout.spacer} />
        <p className={layout.info}>
          Draw {drawCount}
          {state.recycles > 0 ? ` · Pass ${state.recycles + 1}` : ''}
        </p>
      </div>
      <CardTable
        columns={7}
        topRow={topRow}
        tableau={tableau}
        version={state}
        canPick={(pile, index) => !won && canPick(state, pile, index)}
        canDrop={(from, to) => canMove(state, from, to)}
        onMove={onMove}
        onActivate={draw}
        onAutoMove={autoMove}
        onShortcut={onShortcut}
        host={host}
        disabled={paused || won || autoRunning}
        label="Klondike solitaire table"
        theme="green"
        keyboardHelp="Press D to draw from the stock, F to send the focused card to a foundation, U to undo and A to auto-complete when it is offered."
      />
      <p className={layout.status} data-tone={message.tone} aria-hidden="true">
        {message.text}
      </p>
      <div className={layout.footer}>
        <p>{formatWinStats(session.stats)} (Draw {drawCount})</p>
        <p className={layout.hideNarrow}>Double-click a card to send it to a foundation.</p>
      </div>
    </div>
  );
}
