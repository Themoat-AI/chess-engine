const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const KNIGHT_OFFSETS = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1]
];

const KING_OFFSETS = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
];

const SLIDING_DIRECTIONS = {
  b: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
  r: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]
};

const PIECE_SQUARE_TABLES = {
  p: [
    [0,0,0,0,0,0,0,0],
    [50,50,50,50,50,50,50,50],
    [10,10,20,30,30,20,10,10],
    [5,5,10,25,25,10,5,5],
    [0,0,0,20,20,0,0,0],
    [5,-5,-10,0,0,-10,-5,5],
    [5,10,10,-20,-20,10,10,5],
    [0,0,0,0,0,0,0,0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,0,0,0,0,-20,-40],
    [-30,0,10,15,15,10,0,-30],
    [-30,5,15,20,20,15,5,-30],
    [-30,0,15,20,20,15,0,-30],
    [-30,5,10,15,15,10,5,-30],
    [-40,-20,0,5,5,0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,0,0,0,0,0,0,-10],
    [-10,0,5,10,10,5,0,-10],
    [-10,5,5,10,10,5,5,-10],
    [-10,0,10,10,10,10,0,-10],
    [-10,10,10,10,10,10,10,-10],
    [-10,5,0,0,0,0,5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [
    [0,0,0,5,5,0,0,0],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [-5,0,0,0,0,0,0,-5],
    [5,10,10,10,10,10,10,5],
    [0,0,0,0,0,0,0,0]
  ],
  q: [
    [-20,-10,-10,-5,-5,-10,-10,-20],
    [-10,0,0,0,0,0,0,-10],
    [-10,0,5,5,5,5,0,-10],
    [-5,0,5,5,5,5,0,-5],
    [0,0,5,5,5,5,0,-5],
    [-10,5,5,5,5,5,0,-10],
    [-10,0,5,0,0,0,0,-10],
    [-20,-10,-10,-5,-5,-10,-10,-20]
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20,20,0,0,0,0,20,20],
    [20,30,10,0,0,10,30,20]
  ]
};

function cloneBoard(board) {
  return [...board];
}

function colorOf(piece) {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'w' : 'b';
}

function isWhite(piece) {
  return !!piece && piece === piece.toUpperCase();
}

function isBlack(piece) {
  return !!piece && piece === piece.toLowerCase();
}

function squareToCoords(square) {
  const row = Math.floor(square / 8);
  const col = square % 8;
  return { row, col };
}

function coordsToSquare(row, col) {
  return row * 8 + col;
}

function notationForSquare(square) {
  const row = Math.floor(square / 8);
  const col = square % 8;
  return `${FILES[col]}${row + 1}`;
}

function parseSquare(notation) {
  if (!notation || notation.length < 2) return null;
  const file = FILES.indexOf(notation[0].toLowerCase());
  const rank = Number.parseInt(notation[1], 10) - 1;
  if (file === -1 || rank < 0 || rank > 7) return null;
  return coordsToSquare(rank, file);
}

function squareStatus(board, square) {
  return board[square] ?? null;
}

function isInsideBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function makePieceSquareScore(piece, square, perspective) {
  const pieceKey = piece.toLowerCase();
  const table = PIECE_SQUARE_TABLES[pieceKey] ?? new Array(8).fill(0).map(() => new Array(8).fill(0));
  const row = Math.floor(square / 8);
  const col = square % 8;
  const score = table[row][col];
  return isWhite(piece) ? score : -score;
}

function parseFEN(fenString = STARTING_FEN) {
  const normalized = fenString.trim();
  const parts = normalized.split(' ');
  if (parts.length < 2) {
    throw new Error(`Invalid FEN: ${fenString}`);
  }

  const [boardPart, turnPart, castlingPart, enPassantPart, halfmovePart = '0', fullmovePart = '1'] = parts;
  const board = new Array(64).fill(null);
  const rows = boardPart.split('/');
  if (rows.length !== 8) {
    throw new Error(`Invalid FEN board: ${boardPart}`);
  }

  rows.forEach((row, rowIndex) => {
    let squareIndex = 0;
    for (const char of row) {
      const numericValue = Number.parseInt(char, 10);
      if (!Number.isNaN(numericValue)) {
        squareIndex += numericValue;
      } else {
        const boardSquare = (7 - rowIndex) * 8 + squareIndex;
        board[boardSquare] = char;
        squareIndex += 1;
      }
    }
  });

  return {
    board,
    turn: turnPart === 'w' ? 'w' : 'b',
    castling: castlingPart,
    enPassant: enPassantPart && enPassantPart !== '-' ? parseSquare(enPassantPart) : null,
    halfmove: Number.parseInt(halfmovePart, 10) || 0,
    fullmove: Number.parseInt(fullmovePart, 10) || 1
  };
}

function toFEN(state) {
  const rows = [];
  for (let rank = 7; rank >= 0; rank -= 1) {
    let emptyCount = 0;
    let row = '';
    for (let file = 0; file < 8; file += 1) {
      const square = coordsToSquare(rank, file);
      const piece = state.board[square];
      if (!piece) {
        emptyCount += 1;
      } else {
        if (emptyCount > 0) {
          row += String(emptyCount);
          emptyCount = 0;
        }
        row += piece;
      }
    }
    if (emptyCount > 0) row += String(emptyCount);
    rows.push(row);
  }

  let enPassant = '-';
  if (state.enPassant !== null && state.enPassant !== undefined) {
    enPassant = notationForSquare(state.enPassant);
  }

  return `${rows.join('/')} ${state.turn} ${state.castling || '-'} ${enPassant} ${state.halfmove} ${state.fullmove}`;
}

function isSquareAttacked(board, square, byColor) {
  const target = squareToCoords(square);
  const direction = byColor === 'w' ? 1 : -1;

  for (const [rowDelta, colDelta] of KING_OFFSETS) {
    const row = target.row + rowDelta;
    const col = target.col + colDelta;
    if (isInsideBoard(row, col) && board[coordsToSquare(row, col)] === (byColor === 'w' ? 'K' : 'k')) {
      return true;
    }
  }

  for (const [rowDelta, colDelta] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    let row = target.row + rowDelta;
    let col = target.col + colDelta;
    while (isInsideBoard(row, col)) {
      const piece = board[coordsToSquare(row, col)];
      if (piece) {
        const pieceColor = colorOf(piece);
        if (pieceColor === byColor) {
          if (piece.toLowerCase() === 'b' || piece.toLowerCase() === 'q') {
            return true;
          }
        }
        break;
      }
      row += rowDelta;
      col += colDelta;
    }
  }

  for (const [rowDelta, colDelta] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    let row = target.row + rowDelta;
    let col = target.col + colDelta;
    while (isInsideBoard(row, col)) {
      const piece = board[coordsToSquare(row, col)];
      if (piece) {
        const pieceColor = colorOf(piece);
        if (pieceColor === byColor) {
          if (piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q') {
            return true;
          }
        }
        break;
      }
      row += rowDelta;
      col += colDelta;
    }
  }

  for (const [rowDelta, colDelta] of KNIGHT_OFFSETS) {
    const row = target.row + rowDelta;
    const col = target.col + colDelta;
    if (isInsideBoard(row, col)) {
      const piece = board[coordsToSquare(row, col)];
      if (piece && pieceColorMatches(piece, byColor) && piece.toLowerCase() === 'n') {
        return true;
      }
    }
  }

  const pawnRow = byColor === 'w' ? target.row - 1 : target.row + 1;
  const pawnColOptions = [target.col - 1, target.col + 1];
  for (const col of pawnColOptions) {
    if (isInsideBoard(pawnRow, col)) {
      const piece = board[coordsToSquare(pawnRow, col)];
      if (piece && pieceColorMatches(piece, byColor) && piece.toLowerCase() === 'p') {
        return true;
      }
    }
  }

  return false;
}

function pieceColorMatches(piece, color) {
  return !!piece && colorOf(piece) === color;
}

function findKing(board, color) {
  const targetPiece = color === 'w' ? 'K' : 'k';
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === targetPiece) return i;
  }
  return null;
}

function cloneState(state) {
  return {
    ...state,
    board: cloneBoard(state.board),
    enPassant: state.enPassant !== null && state.enPassant !== undefined ? state.enPassant : null
  };
}

function generatePseudoLegalMoves(state) {
  const moves = [];
  const { board, turn, enPassant } = state;

  for (let from = 0; from < board.length; from += 1) {
    const piece = board[from];
    if (!piece || colorOf(piece) !== turn) continue;

    const { row, col } = squareToCoords(from);
    const isWhitePiece = isWhite(piece);
    const direction = isWhitePiece ? 1 : -1;

    if (piece.toLowerCase() === 'p') {
      const forwardRow = row + direction;
      if (isInsideBoard(forwardRow, col)) {
        const targetSquare = coordsToSquare(forwardRow, col);
        if (!board[targetSquare]) {
          const promotion = forwardRow === 7 || forwardRow === 0 ? 'q' : null;
          moves.push({ from, to: targetSquare, piece, color: turn, capture: false, promotion, isCastle: false, isEnPassant: false });

          const startingRow = isWhitePiece ? 1 : 6;
          const doubleTargetRow = row + direction * 2;
          if (row === startingRow && isInsideBoard(doubleTargetRow, col)) {
            const doubleTarget = coordsToSquare(doubleTargetRow, col);
            if (!board[doubleTarget]) {
              moves.push({ from, to: doubleTarget, piece, color: turn, capture: false, promotion: null, isCastle: false, isEnPassant: false });
            }
          }
        }
      }

      for (const colDelta of [-1, 1]) {
        const nextRow = row + direction;
        const nextCol = col + colDelta;
        if (!isInsideBoard(nextRow, nextCol)) continue;
        const targetSquare = coordsToSquare(nextRow, nextCol);
        const targetPiece = board[targetSquare];
        if (targetPiece && colorOf(targetPiece) !== turn) {
          const promotion = nextRow === 7 || nextRow === 0 ? 'q' : null;
          moves.push({ from, to: targetSquare, piece, color: turn, capture: true, promotion, isCastle: false, isEnPassant: false });
        }

        const enPassantTarget = enPassant !== null && enPassant !== undefined ? enPassant : null;
        if (enPassantTarget !== null && targetSquare === enPassantTarget) {
          const capturedRow = row;
          const capturedSquare = coordsToSquare(capturedRow, nextCol);
          if (board[capturedSquare] && colorOf(board[capturedSquare]) !== turn && board[capturedSquare].toLowerCase() === 'p') {
            moves.push({ from, to: targetSquare, piece, color: turn, capture: true, promotion: nextRow === 7 || nextRow === 0 ? 'q' : null, isCastle: false, isEnPassant: true, capturedSquare });
          }
        }
      }
    }

    if (piece.toLowerCase() === 'n') {
      for (const [rowDelta, colDelta] of KNIGHT_OFFSETS) {
        const targetRow = row + rowDelta;
        const targetCol = col + colDelta;
        if (!isInsideBoard(targetRow, targetCol)) continue;
        const targetSquare = coordsToSquare(targetRow, targetCol);
        const targetPiece = board[targetSquare];
        if (!targetPiece || colorOf(targetPiece) !== turn) {
          moves.push({ from, to: targetSquare, piece, color: turn, capture: !!targetPiece, promotion: null, isCastle: false, isEnPassant: false });
        }
      }
    }

    if (piece.toLowerCase() === 'b' || piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q') {
      const directions = SLIDING_DIRECTIONS[piece.toLowerCase()];
      for (const [rowDelta, colDelta] of directions) {
        let targetRow = row + rowDelta;
        let targetCol = col + colDelta;
        while (isInsideBoard(targetRow, targetCol)) {
          const targetSquare = coordsToSquare(targetRow, targetCol);
          const targetPiece = board[targetSquare];
          if (!targetPiece) {
            moves.push({ from, to: targetSquare, piece, color: turn, capture: false, promotion: null, isCastle: false, isEnPassant: false });
          } else {
            if (colorOf(targetPiece) !== turn) {
              moves.push({ from, to: targetSquare, piece, color: turn, capture: true, promotion: null, isCastle: false, isEnPassant: false });
            }
            break;
          }
          targetRow += rowDelta;
          targetCol += colDelta;
        }
      }
    }

    if (piece.toLowerCase() === 'k') {
      for (const [rowDelta, colDelta] of KING_OFFSETS) {
        const targetRow = row + rowDelta;
        const targetCol = col + colDelta;
        if (!isInsideBoard(targetRow, targetCol)) continue;
        const targetSquare = coordsToSquare(targetRow, targetCol);
        const targetPiece = board[targetSquare];
        if (!targetPiece || colorOf(targetPiece) !== turn) {
          moves.push({ from, to: targetSquare, piece, color: turn, capture: !!targetPiece, promotion: null, isCastle: false, isEnPassant: false });
        }
      }

      const castlingRights = state.castling || '';
      if (turn === 'w' && from === 4 && (castlingRights.includes('K') || castlingRights.includes('Q'))) {
        if (castlingRights.includes('K') && !board[5] && !board[6] && !isSquareAttacked(board, 4, 'b') && !isSquareAttacked(board, 5, 'b') && !isSquareAttacked(board, 6, 'b')) {
          moves.push({ from, to: 6, piece, color: turn, capture: false, promotion: null, isCastle: true, isEnPassant: false, rookFrom: 7, rookTo: 5 });
        }
        if (castlingRights.includes('Q') && !board[3] && !board[2] && !board[1] && !isSquareAttacked(board, 4, 'b') && !isSquareAttacked(board, 3, 'b') && !isSquareAttacked(board, 2, 'b')) {
          moves.push({ from, to: 2, piece, color: turn, capture: false, promotion: null, isCastle: true, isEnPassant: false, rookFrom: 0, rookTo: 3 });
        }
      }

      if (turn === 'b' && from === 60 && (castlingRights.includes('k') || castlingRights.includes('q'))) {
        if (castlingRights.includes('k') && !board[61] && !board[62] && !isSquareAttacked(board, 60, 'w') && !isSquareAttacked(board, 61, 'w') && !isSquareAttacked(board, 62, 'w')) {
          moves.push({ from, to: 62, piece, color: turn, capture: false, promotion: null, isCastle: true, isEnPassant: false, rookFrom: 63, rookTo: 61 });
        }
        if (castlingRights.includes('q') && !board[59] && !board[58] && !board[57] && !isSquareAttacked(board, 60, 'w') && !isSquareAttacked(board, 59, 'w') && !isSquareAttacked(board, 58, 'w')) {
          moves.push({ from, to: 58, piece, color: turn, capture: false, promotion: null, isCastle: true, isEnPassant: false, rookFrom: 56, rookTo: 59 });
        }
      }
    }
  }

  return moves;
}

function applyMove(state, move) {
  const nextState = cloneState(state);
  const board = nextState.board;
  const piece = board[move.from];
  const movingColor = colorOf(piece);

  board[move.from] = null;

  if (move.isEnPassant) {
    const capturedSquare = move.capturedSquare ?? (move.to - 8);
    board[capturedSquare] = null;
  }

  if (move.isCastle) {
    const rookFrom = move.rookFrom;
    const rookTo = move.rookTo;
    const rook = board[rookFrom];
    board[rookFrom] = null;
    board[rookTo] = rook;
  }

  const pieceForMove = move.promotion ? (movingColor === 'w' ? move.promotion.toUpperCase() : move.promotion.toLowerCase()) : piece;
  board[move.to] = pieceForMove;

  if (piece && piece.toLowerCase() === 'p' && (move.to >= 56 || move.to <= 7)) {
    board[move.to] = movingColor === 'w' ? 'Q' : 'q';
  }

  if (piece && piece.toLowerCase() === 'k') {
    nextState.castling = nextState.castling.replace(movingColor === 'w' ? /[KQ]/g : /[kq]/g, '');
  }

  if (piece && piece.toLowerCase() === 'r') {
    if (move.from === 0) nextState.castling = nextState.castling.replace('Q', '');
    if (move.from === 7) nextState.castling = nextState.castling.replace('K', '');
    if (move.from === 56) nextState.castling = nextState.castling.replace('q', '');
    if (move.from === 63) nextState.castling = nextState.castling.replace('k', '');
  }

  const capturedPiece = board[move.to] && move.capture && board[move.to] !== piece ? board[move.to] : null;
  if (capturedPiece && capturedPiece.toLowerCase() === 'r') {
    if (move.to === 0) nextState.castling = nextState.castling.replace('Q', '');
    if (move.to === 7) nextState.castling = nextState.castling.replace('K', '');
    if (move.to === 56) nextState.castling = nextState.castling.replace('q', '');
    if (move.to === 63) nextState.castling = nextState.castling.replace('k', '');
  }

  const movedPiece = board[move.to];
  if (movedPiece && movedPiece.toLowerCase() === 'p' && Math.abs(move.from - move.to) === 16) {
    const pawnRow = Math.min(move.from, move.to) + 8;
    nextState.enPassant = pawnRow;
  } else {
    nextState.enPassant = null;
  }

  nextState.turn = movingColor === 'w' ? 'b' : 'w';
  nextState.fullmove += movingColor === 'b' ? 1 : 0;
  nextState.halfmove = piece && piece.toLowerCase() === 'p' || move.capture ? 0 : nextState.halfmove + 1;

  return nextState;
}

function getLegalMoves(state) {
  const pseudo = generatePseudoLegalMoves(state);
  return pseudo.filter((move) => {
    const nextState = applyMove(state, move);
    const kingSquare = findKing(nextState.board, state.turn);
    if (kingSquare === null) return false;
    return !isSquareAttacked(nextState.board, kingSquare, nextState.turn);
  });
}

function isKingInCheck(board, color) {
  const kingSquare = findKing(board, color);
  if (kingSquare === null) return false;
  return isSquareAttacked(board, kingSquare, color === 'w' ? 'b' : 'w');
}

function evaluateState(state, perspective = 'w') {
  let score = 0;
  const board = state.board;
  for (let i = 0; i < board.length; i += 1) {
    const piece = board[i];
    if (!piece) continue;
    const pieceValue = PIECE_VALUES[piece.toLowerCase()] ?? 0;
    const squareScore = makePieceSquareScore(piece, i, perspective);
    score += (isWhite(piece) ? 1 : -1) * (pieceValue + squareScore);
  }

  const mobility = getLegalMoves(state).length;
  score += (state.turn === 'w' ? 1 : -1) * mobility * 2;

  if (isKingInCheck(board, 'w') && state.turn === 'w') score -= 50;
  if (isKingInCheck(board, 'b') && state.turn === 'b') score += 50;

  return perspective === 'w' ? score : -score;
}

function minimax(state, depth, alpha, beta, maximizingColor) {
  const legalMoves = getLegalMoves(state);
  if (depth === 0 || legalMoves.length === 0) {
    return evaluateState(state, maximizingColor);
  }

  if (state.turn === maximizingColor) {
    let best = -Infinity;
    for (const move of legalMoves) {
      const next = applyMove(state, move);
      const value = minimax(next, depth - 1, alpha, beta, maximizingColor);
      best = Math.max(best, value);
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const move of legalMoves) {
    const next = applyMove(state, move);
    const value = minimax(next, depth - 1, alpha, beta, maximizingColor);
    best = Math.min(best, value);
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return best;
}

function findBestMove(fenString = STARTING_FEN, depth = 3) {
  const state = parseFEN(fenString);
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0) {
    return { move: null, fen: fenString, score: 0 };
  }

  let bestMove = legalMoves[0];
  let bestScore = -Infinity;
  const maximizingColor = state.turn;

  for (const move of legalMoves) {
    const nextState = applyMove(state, move);
    const score = minimax(nextState, depth - 1, -Infinity, Infinity, maximizingColor);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return {
    move: {
      from: notationForSquare(bestMove.from),
      to: notationForSquare(bestMove.to),
      piece: bestMove.piece,
      promotion: bestMove.promotion || null,
      san: `${notationForSquare(bestMove.from)}${notationForSquare(bestMove.to)}`
    },
    fen: toFEN(applyMove(state, bestMove)),
    score: bestScore
  };
}

class ChessEngine {
  constructor(fen = STARTING_FEN) {
    this.state = parseFEN(fen);
  }

  getLegalMoves() {
    return getLegalMoves(this.state).map((move) => ({
      from: notationForSquare(move.from),
      to: notationForSquare(move.to),
      piece: move.piece,
      capture: move.capture,
      promotion: move.promotion,
      castle: move.isCastle,
      san: `${notationForSquare(move.from)}${notationForSquare(move.to)}`
    }));
  }

  makeMove(moveInput) {
    let parsedMove = null;
    if (typeof moveInput === 'string') {
      const normalized = moveInput.trim();
      if (normalized.length === 4 || normalized.length === 5) {
        const from = parseSquare(normalized.slice(0, 2));
        const to = parseSquare(normalized.slice(2, 4));
        if (from !== null && to !== null) {
          parsedMove = { from, to, promotion: normalized.length === 5 ? normalized[4].toLowerCase() : null };
        }
      }
    } else if (moveInput && typeof moveInput === 'object') {
      parsedMove = {
        from: parseSquare(moveInput.from),
        to: parseSquare(moveInput.to),
        promotion: moveInput.promotion ? moveInput.promotion.toLowerCase() : null
      };
    }

    const legalMoves = getLegalMoves(this.state);
    const match = legalMoves.find((move) => {
      if (move.from !== parsedMove.from || move.to !== parsedMove.to) return false;
      if (parsedMove.promotion && move.promotion !== parsedMove.promotion) return false;
      return true;
    });

    if (!match) {
      throw new Error(`Illegal move: ${moveInput}`);
    }

    this.state = applyMove(this.state, match);
    return toFEN(this.state);
  }

  findBestMove(depth = 3) {
    return findBestMove(toFEN(this.state), depth);
  }

  getStatus() {
    const legalMoves = getLegalMoves(this.state);
    if (legalMoves.length === 0) {
      if (isKingInCheck(this.state.board, this.state.turn)) {
        return 'checkmate';
      }
      return 'stalemate';
    }
    if (isKingInCheck(this.state.board, this.state.turn)) {
      return 'check';
    }
    return 'normal';
  }
}

export {
  ChessEngine,
  STARTING_FEN,
  applyMove,
  evaluateState,
  findBestMove,
  generatePseudoLegalMoves,
  getLegalMoves,
  isKingInCheck,
  parseFEN,
  toFEN
};

export const engine = new ChessEngine();
