# Chess Engine + Live Tracker

This repository contains a complete chess engine and a browser extension for tracking live chess games.

## Features

- Full legal move generation for standard chess
- FEN parsing and export
- Check, checkmate, stalemate detection
- Simple alpha-beta search with evaluation
- Browser extension for Lichess and chess.com-style pages
- Automatic game tracking and PGN export support

## Engine usage

```bash
npm test
node --input-type=module -e "import { ChessEngine } from './src/chess-engine.js'; const game = new ChessEngine(); console.log(game.getLegalMoves().length); console.log(game.findBestMove(2));"
```

## Example

```js
import { ChessEngine } from './src/chess-engine.js';
const game = new ChessEngine('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
console.log(game.getLegalMoves().slice(0, 5));
console.log(game.findBestMove(3));
```

## Browser extension

1. Open `chrome://extensions` in Chrome or Edge.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `extension/` directory.
5. Open a chess board on Lichess or chess.com and use the popup to inspect the current board.

## Live tracking

The extension watches the page for board state and move text, stores the current FEN and moves locally, and can export a PGN-like match log.

## Project structure

- `src/chess-engine.js` — engine logic
- `tests/engine.test.js` — engine tests
- `extension/` — browser extension files

## Notes

This engine is a practical, self-contained implementation focused on correctness and real-time browser tracking rather than a full grandmaster-level engine.
