# Game catalogue research

Research date: 2026-10-29. Goal: decide which games to add so the site is more useful.

## Evidence quality

Web search found no authoritative genre-share data from Poki or CrazyGames. Treat the points below as directional only.

- Puzzle and action are the genres named most often; arcade and match-3 close behind. FastPlayGames contradicts itself on which is first, and it is a competitor: https://fastplaygames.com/browser-gaming-statistics
- A January 2026 Canadian Google-search study found classic card games (solitaire, cribbage, euchre) holding steady interest. Canada only: https://cultmtl.com/2026/01/new-study-highlights-canadian-cities-showing-the-strongest-interest-in-classic-card-games-online/
- Google on insufficient content: https://blog.google/products/adsense/how-to-address-insufficient-content/
- Third-party advice for game sites is to add original text around the game: https://neatforge.pages.dev/guides/adsense-rejection-reasons-tool-sites
- No search-volume data was found for mahjong or Wordle-style games. Check Google Trends or Ahrefs/Semrush before committing to titles.

## Current catalogue gaps (23 games)

Recommendations below are judgment, not sourced data.

| Priority | Game (original names only) | Reason |
|---|---|---|
| 1 | Block stacker (falling-pieces puzzle). **Built 2026-10-29 as Stackfall** | Biggest missing puzzle staple; the genre name is trademarked, so use an original design |
| 2 | Connect Four-style. **Built 2026-10-29 as Drop Four** | Small rules, quick to build |
| 3 | Reversi/Othello-style | Pairs with chess and checkers |
| 4 | Sliding puzzle, nonogram | Cheap puzzle depth |
| 5 | Hearts or spades | Extends the card category |
| 6 | Maze chase, tower defense | Fills the action gap; larger builds |

Skip blackjack and poker-style games: gambling-adjacent content invites ad-policy trouble.

## Each new game needs

Rules module with tests (as in `tests/games/`), art, `content.ts` in the existing `GameContent` shape, an entry in the games config and loaders, and a smoke-test pass.
