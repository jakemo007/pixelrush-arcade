'use client';

import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { CardTable, type PileRef, type PileSpec } from '@/games/cards/CardTable';
import { canUndo, createHistory, pushHistory, undoHistory, type History } from '@/games/cards/history';
import { UndoIcon } from '@/games/cards/icons';
import { cardName } from '@/games/cards/model';
import { formatWinStats } from '@/games/cards/stats';
import { useFinishAfter, useSolitaireSession } from '@/games/cards/useSolitaireSession';
import layout from '@/games/cards/SolitaireLayout.module.css';
import type { DomGameProps, SoundCue } from '@/games/dom/types';
import { randomInt, createRng, randomSeed } from '@/lib/utils/random';
import {
  CELL_COUNT,
  FOUNDATION_COUNT,
  MAX_DEAL,
  MIN_DEAL,
  applyMove,
  autoMoveSafe,
  autoMoveTarget,
  canMove,
  canPick,
  cellId,
  dealFreeCell,
  emptyColumnCount,
  foundationId,
  hasLegalMove,
  isWon,
  maxMovable,
  moveError,
  parsePile,
  pileCards,
  tableauId,
  type FreeCellState,
} from './rules';

type Tone = 'info' | 'warn' | 'good';

const NEXT_DEAL_KEY = 'next-deal';
const isDealNumber = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= MIN_DEAL && v <= MAX_DEAL;

function pileName(pile: string): string {
  const p = parsePile(pile);
  if (!p) return pile;
  if (p.kind === 'tableau') return `column ${p.index + 1}`;
  if (p.kind === 'cell') return `free cell ${p.index + 1}`;
  return `foundation ${p.index + 1}`;
}

export default function FreeCell({ host, paused }: DomGameProps) {
  const dealInputId = useId();
  const [history, setHistory] = useState<History<FreeCellState>>(() => {
    const chosen = host.storage.read(NEXT_DEAL_KEY, isDealNumber);
    const deal = chosen ?? randomInt(createRng(randomSeed()), MIN_DEAL, MAX_DEAL);
    return createHistory(dealFreeCell(deal));
  });
  const [message, setMessage] = useState<{ text: string; tone: Tone }>({
    text: 'Every card is face up. Plan ahead, and use the free cells to park single cards.',
    tone: 'info',
  });
  const [dealInput, setDealInput] = useState('');
  const [pendingDeal, setPendingDeal] = useState<number | null>(null);
  const session = useSolitaireSession(host, 'standard', paused);
  const state = history.present;
  const won = session.over;
  const { setHud, storage } = host;

  useEffect(() => {
    storage.remove(NEXT_DEAL_KEY);
  }, [storage]);

  useEffect(() => {
    setHud([
      { id: 'deal', label: 'Deal', value: `#${state.deal}` },
      { id: 'moves', label: 'Moves', value: String(state.moves) },
      { id: 'time', label: 'Time', value: session.timeText },
    ]);
  }, [setHud, state.deal, state.moves, session.timeText]);

  const finish = useCallback(() => {
    host.finish({ outcome: 'won', value: session.winTime ?? undefined, detail: `Deal #${state.deal} solved in ${state.moves} moves.` });
  }, [host, session.winTime, state.deal, state.moves]);
  useFinishAfter(won, finish, 650);

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
    const count = pileCards(state, from.pile).length - from.index;
    const afterMove = applyMove(state, from, to)!;
    const { state: next, moved } = autoMoveSafe(afterMove);
    session.start();
    setHistory((h) => pushHistory(h, next));
    let text = `Moved ${cardName(moving)}${count > 1 ? ` and ${count - 1} more` : ''} to ${pileName(to)}.`;
    if (moved.length > 0) text += ` ${moved.length} card${moved.length > 1 ? 's' : ''} went up to the foundations automatically.`;
    if (isWon(next)) {
      session.win();
      setMessage({ text: 'All four foundations are complete. You win!', tone: 'good' });
      host.announce('All cards are on the foundations. You win!');
      return true;
    }
    const stuck = !hasLegalMove(next);
    if (stuck) text += ' No legal moves are left: undo or start a new game.';
    const sound: SoundCue = parsePile(to)?.kind === 'foundation' || moved.length > 0 ? 'match' : 'place';
    host.playSound(stuck ? 'invalid' : sound);
    host.announce(text);
    setMessage({ text, tone: stuck ? 'warn' : 'info' });
    return true;
  };

  const undo = () => {
    if (won || !canUndo(history)) return;
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

  const onShortcut = (key: string, focused: PileRef | null): boolean => {
    if (key === 'u' || key === 'z') {
      undo();
      return true;
    }
    if (key === 'f' && focused) {
      if (!autoMove(focused)) {
        host.playSound('invalid');
        host.announce('That card has nowhere to go automatically.');
      }
      return true;
    }
    return false;
  };

  const startDeal = (deal: number) => {
    storage.write(NEXT_DEAL_KEY, deal);
    host.newGame();
  };

  const requestDeal = (deal: number) => {
    if (session.started && !won) setPendingDeal(deal);
    else startDeal(deal);
  };

  const onDealSubmit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(dealInput);
    if (!isDealNumber(n)) {
      setMessage({ text: `Enter a deal number from ${MIN_DEAL} to ${MAX_DEAL.toLocaleString('en-US')}.`, tone: 'warn' });
      return;
    }
    requestDeal(n);
  };

  const topRow: PileSpec[] = [
    ...Array.from({ length: CELL_COUNT }, (_, i): PileSpec => {
      const card = state.cells[i];
      return { id: cellId(i), kind: 'stack', cards: card ? [card] : [], name: `Free cell ${i + 1}`, hint: 'Holds any one card' };
    }),
    ...Array.from({ length: FOUNDATION_COUNT }, (_, i): PileSpec => ({
      id: foundationId(i),
      kind: 'stack',
      cards: state.foundations[i]!,
      name: `Foundation ${i + 1}`,
      placeholder: 'A',
      hint: 'Start it with any Ace',
    })),
  ];
  const tableau: PileSpec[] = state.tableau.map((cards, i) => ({ id: tableauId(i), kind: 'fan', cards, name: `Column ${i + 1}`, hint: 'Any card or valid sequence can go here' }));
  const capacity = Math.min(13, maxMovable(state, false));
  const capacityToEmpty = emptyColumnCount(state) > 0 ? Math.min(13, maxMovable(state, true)) : null;

  return (
    <div className={layout.game}>
      <div className={layout.toolbar}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={undo} disabled={!canUndo(history) || won}>
          <UndoIcon /> Undo
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => requestDeal(state.deal)}>
          Replay deal
        </button>
        <span className={layout.spacer} />
        <p className={layout.info} title="The longest sequence you can move at once">
          Move up to {capacity} card{capacity > 1 ? 's' : ''}
          {capacityToEmpty !== null ? ` (${capacityToEmpty} into an empty column)` : ''}
        </p>
      </div>
      {pendingDeal !== null && (
        <div className={layout.toolbar} role="group" aria-label="Confirm new deal">
          <p className={layout.status} data-tone="warn">
            Abandon this game and play deal #{pendingDeal}?
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => startDeal(pendingDeal)} autoFocus>
            Play deal #{pendingDeal}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPendingDeal(null)}>
            Keep playing
          </button>
        </div>
      )}
      <CardTable
        columns={8}
        topRow={topRow}
        tableau={tableau}
        version={state}
        canPick={(pile, index) => !won && canPick(state, pile, index)}
        canDrop={(from, to) => canMove(state, from, to)}
        onMove={onMove}
        onAutoMove={autoMove}
        onShortcut={onShortcut}
        host={host}
        disabled={paused || won}
        label={`FreeCell table, deal ${state.deal}`}
        theme="cyan"
        keyboardHelp="Press F to send the focused card to a foundation or a free cell, and U to undo."
      />
      <p className={layout.status} data-tone={message.tone} aria-hidden="true">
        {message.text}
      </p>
      <div className={layout.footer}>
        <p>{formatWinStats(session.stats)}</p>
        <form className={layout.dealForm} onSubmit={onDealSubmit}>
          <label htmlFor={dealInputId}>Deal #</label>
          <input
            id={dealInputId}
            type="number"
            inputMode="numeric"
            min={MIN_DEAL}
            max={MAX_DEAL}
            placeholder={String(state.deal)}
            value={dealInput}
            onChange={(e) => setDealInput(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            Play deal
          </button>
        </form>
      </div>
    </div>
  );
}
