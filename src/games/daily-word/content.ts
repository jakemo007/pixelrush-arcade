import { DOM_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Daily Word Puzzle: Guess the Five-Letter Word',
  metaDescription:
    'A new five-letter word every day at 00:00 UTC. Six guesses, colour and shape clues for every letter, streak stats and an unlimited practice mode.',
  intro: [
    'Daily Word Puzzle hides one five-letter word each day, and you have six guesses to find it. Every guess must be a real word, and after each one the tiles tell you which letters are in the answer and whether they are in the right place.',
    'Everyone who plays on the same UTC date gets the same word, so you can compare notes with friends. When you want more, switch to Practice for a random word as often as you like.',
  ],
  objective: 'Work out the hidden five-letter word in six guesses or fewer.',
  rules: [
    'Each guess must be a five-letter word from the game’s word list of about 3,500 common English words, plurals and verb forms. Words that are not on the list are rejected and do not use up a guess.',
    'A green tile with a bar underneath means the letter is in the word and in that exact spot.',
    'An amber tile with a dot underneath means the letter is in the word but in a different spot.',
    'A dark grey tile means the letter is not in the word, or that every copy of it is already accounted for by other tiles in the same guess.',
    'Repeated letters are scored one copy at a time: exact matches are marked first, then the remaining copies are marked amber only while the answer still has unmatched copies of that letter.',
    'You win by guessing the word exactly. After six wrong guesses the answer is shown.',
  ],
  howToPlay: [
    'Type a five-letter word on your keyboard, or tap the letters on the on-screen keyboard.',
    'Press Enter to submit it. Use Backspace to fix a typo before you submit.',
    'Read the tiles: keep green letters where they are, move amber letters to a new spot, and avoid grey ones.',
    'The on-screen keyboard keeps track of every letter you have tried, with the same colours and markers.',
    'Find the word within six guesses. In Daily mode your board is saved, so you can close the page and come back later the same day.',
    'Switch the Mode to Practice above the board for unlimited random words that do not affect your daily statistics.',
  ],
  controls: [
    { action: 'Type a letter', keys: ['A–Z'], touch: 'Tap a letter on the on-screen keyboard' },
    { action: 'Submit the guess', keys: ['Enter'], touch: 'Enter key on the on-screen keyboard' },
    { action: 'Delete the last letter', keys: ['Backspace'], touch: 'Backspace key on the on-screen keyboard' },
    { action: 'Switch between Daily and Practice', keys: [], keysNote: 'Mode buttons', touch: 'Mode buttons above the board' },
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'There are no points: the result is how many guesses you needed, from 1 to 6.',
    'Daily statistics track games played, win percentage, your current streak, your longest streak and how many guesses each win took.',
    'Your streak grows by one for each daily word you solve on consecutive UTC days. Missing a day or failing a word resets it to zero.',
    'Practice games never change the statistics. Everything is saved only in this browser.',
  ],
  difficultyTitle: 'Daily and Practice modes',
  difficulty: [
    'Daily: one word for everyone, chosen from about 1,200 hand-picked common words. The word changes at 00:00 UTC, and no answer repeats until the whole list has been used, which takes more than three years.',
    'Practice: a random word from the same answer list every game (never today’s daily word), with unlimited replays.',
    'Answers are everyday words without plural -s endings, names or anything rude, though some days are harder than others because of uncommon letters or repeated ones.',
  ],
  tips: [
    {
      title: 'Open with common letters',
      body: 'A first guess with several vowels and common consonants such as R, S, T, L and N rules letters in or out quickly.',
    },
    {
      title: 'Use your second guess to explore',
      body: 'If the first guess found little, try five completely new letters instead of rearranging the old ones.',
    },
    {
      title: 'Remember double letters',
      body: 'Answers can repeat a letter. If you are stuck with few letters left, consider words like those with a doubled E or O.',
    },
    {
      title: 'Check the keyboard before you type',
      body: 'Struck-through grey keys are ruled out, so you never need to use them again.',
    },
  ],
  faq: [
    {
      q: 'Does everyone get the same word?',
      a: 'Yes. The daily word is worked out from the current UTC date, so everyone playing on the same UTC day gets the same word. It changes at 00:00 UTC, which is the evening of the day before in the Americas.',
    },
    {
      q: 'Can I play more than one word a day?',
      a: 'The daily word can be played once per day. Switch to Practice mode for unlimited random words; they do not count towards your streak or statistics.',
    },
    {
      q: 'Where are my statistics and streak saved?',
      a: 'Only in this browser’s local storage. There are no accounts, no syncing between devices and no global leaderboard, and clearing your browser’s site data resets them.',
    },
    {
      q: 'Why was my word rejected?',
      a: 'Guesses must be real five-letter words on the game’s list of common words. Rare words, names and abbreviations are not included. A rejected word does not cost you a guess.',
    },
    {
      q: 'Can I play if I find the colours hard to tell apart?',
      a: 'Yes. Correct letters also have a bar underneath, misplaced letters a dot, and missing letters are struck through on the keyboard. Screen readers announce each letter’s result.',
    },
  ],
};
