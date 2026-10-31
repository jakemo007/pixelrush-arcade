import { DOM_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Typing Speed Test: Check Your WPM and Accuracy',
  metaDescription:
    'Take a free 60 or 30 second typing test with original passages. Watch your words per minute and accuracy update live, then try to beat your best speed.',
  intro: [
    'Typing Speed Challenge is a timed typing test. Type the passage on screen as quickly and accurately as you can before the clock runs out, and see your speed in words per minute (WPM) and your accuracy update as you go.',
    'All the practice texts are original, everyday English with normal punctuation, written for this site. Each test strings several of them together in a random order, so you are reading fresh text rather than repeating one you have memorized.',
  ],
  objective:
    'Type as much of the passage as you can, correctly, before time runs out. Your score is your net speed: the correct characters you typed, converted to words per minute.',
  rules: [
    'Choose a 60-second or 30-second test. The timer starts with your first keystroke, not when the page opens.',
    'Correct characters turn bright, mistakes are highlighted in red with a wavy underline, and a blinking bar shows where you are.',
    'You can use Backspace to fix mistakes. Deleting does not count as a keystroke, but every character you type, including a retyped one, does.',
    'Pasting and dragging text into the box are turned off, and you cannot move the cursor back into the text with the arrow keys: you always type at the end.',
    'Like most typing tests, there is no pause: once you start, the clock runs until the test ends.',
    'The test ends when the time is up (or, if you are very fast, when you reach the end of the text).',
  ],
  howToPlay: [
    'Pick a duration: 60 seconds or 30 seconds.',
    'Click or tap the text box. On a phone or tablet this opens your on-screen keyboard.',
    'Start typing the passage. The clock starts with your first character.',
    'Keep your eyes slightly ahead of the cursor and keep a steady rhythm. Fix a mistake with Backspace if you notice it straight away; otherwise keep going.',
    'When the time is up you will see your net speed, accuracy and gross speed. Start a new game to try a different text.',
  ],
  controls: [
    { action: 'Type the passage', keys: ['Letters', 'Space'], touch: 'Tap the text, then type on your keyboard' },
    { action: 'Fix a mistake', keys: ['Backspace'], touch: 'Delete key on your keyboard' },
    { action: 'Change the test length', keys: [], keysNote: 'Duration buttons', touch: 'Duration buttons above the text' },
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'A "word" is counted as 5 characters, including spaces and punctuation, which is the usual standard for typing tests.',
    'Net speed (your score) = correct characters ÷ 5 ÷ minutes. Correct characters are the characters in your typed text that match the passage when the test ends.',
    'Gross speed = every character you typed (mistakes and retyped characters included) ÷ 5 ÷ minutes.',
    'Accuracy = correct keystrokes ÷ all keystrokes, where a keystroke is correct if it matched the passage when you typed it. Fixing a mistake later does not undo the missed keystroke.',
    'Your best net speed is saved separately for the 60-second and 30-second tests, in this browser only.',
  ],
  difficultyTitle: 'Test lengths',
  difficulty: [
    '30 seconds: a quick sprint. Short tests are a little more forgiving of slow starts and tiredness, so scores are often slightly higher.',
    '60 seconds: the standard length for comparing typing speeds. It rewards a steady rhythm over bursts.',
    'For reference, many people type somewhere between 35 and 45 WPM; above 60 WPM is fast, and above 90 WPM is very fast.',
  ],
  tips: [
    {
      title: 'Accuracy first, speed second',
      body: 'Every mistake costs you twice: the wrong keystroke and the time to fix it. Slow down slightly until your accuracy stays above 95%, then build speed.',
    },
    {
      title: 'Read ahead',
      body: 'Look at the next word or two, not the letter you are typing. Your fingers can only keep moving if your eyes are already further along.',
    },
    {
      title: 'Use all your fingers',
      body: 'Rest your fingers on the home row (A S D F and J K L ;) and reach from there. It feels slower at first but is much faster in the long run.',
    },
    {
      title: 'Keep a steady rhythm',
      body: 'Even, unhurried keystrokes beat fast bursts with pauses in between. Try to keep the same pace from the first word to the last.',
    },
  ],
  faq: [
    {
      q: 'How is WPM calculated?',
      a: 'Characters are divided by 5 to get "words", then divided by the minutes elapsed. Your score is net WPM, which only counts the characters that are correct when the test ends. Gross WPM counts every character you typed.',
    },
    {
      q: 'Does it work on a phone or tablet?',
      a: 'Yes. Tap the passage to open your on-screen keyboard. Autocorrect and automatic capitals are turned off for the text box, and curly quotes from phone keyboards are accepted as normal apostrophes.',
    },
    {
      q: 'Why can I not paste text?',
      a: 'It is a typing test, so pasting and dropping text are blocked. Only characters you type yourself count.',
    },
    {
      q: 'Where are my results saved?',
      a: 'Your best net speed for each test length is saved in your browser’s local storage on this device. There are no accounts or global leaderboards.',
    },
  ],
};
