import { GoGame } from "./goGame";
import type { StoneColor } from "../types/go";

function listLegalMoves(game: GoGame, color: StoneColor) {
  const moves: Array<{ x: number; y: number }> = [];
  const size = game.getBoardSize();
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (game.isLegalMove(x, y, color)) {
        moves.push({ x, y });
      }
    }
  }
  return moves;
}

function randomMove(game: GoGame, color: StoneColor) {
  const legal = listLegalMoves(game, color);
  if (legal.length === 0) return null;
  return legal[Math.floor(Math.random() * legal.length)];
}

function randomPlayoutScore(root: GoGame, maxMoves: number, perspective: StoneColor) {
  const playout = root.clone();
  let passes = 0;
  let turns = 0;
  while (passes < 2 && turns < maxMoves) {
    const color = playout.getTurn();
    const move = randomMove(playout, color);
    if (!move) {
      playout.pass(color);
      passes += 1;
    } else {
      playout.playMove(move.x, move.y, color);
      passes = 0;
    }
    turns += 1;
  }
  const territory = playout.getTerritoryEstimate();
  const opponent = perspective === "black" ? "white" : "black";
  return (territory[perspective] ?? 0) - (territory[opponent] ?? 0);
}

export function pickAiMove(
  game: GoGame,
  color: StoneColor,
  options: { playouts?: number; playoutDepth?: number } = {},
) {
  const legalMoves = listLegalMoves(game, color);
  if (legalMoves.length === 0) return null;

  const playouts = options.playouts ?? (game.getBoardSize() <= 9 ? 60 : 30);
  const playoutDepth = options.playoutDepth ?? (game.getBoardSize() <= 9 ? 40 : 60);

  type Candidate = { x: number; y: number; score: number };
  let bestMove: Candidate | undefined;

  legalMoves.forEach(({ x, y }) => {
    const sandbox = game.clone();
    sandbox.playMove(x, y, color);
    let totalScore = 0;
    for (let i = 0; i < playouts; i += 1) {
      totalScore += randomPlayoutScore(sandbox, playoutDepth, color);
    }
    const avgScore = totalScore / playouts;
    if (!bestMove || avgScore > bestMove.score) {
      bestMove = { x, y, score: avgScore };
    }
  });

  if (!bestMove) {
    return null;
  }
  return { x: bestMove.x, y: bestMove.y };
}
