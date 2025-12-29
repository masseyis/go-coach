import { GoGame } from "./goGame";
import type { StoneColor } from "../types/go";

export function pickAiMove(game: GoGame, color: StoneColor) {
  const size = game.getBoardSize();
  let best: { x: number; y: number; score: number } | null = null;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!game.isLegalMove(x, y, color)) continue;
      const sandbox = game.clone();
      sandbox.turn = color;
      const result = sandbox.playMove(x, y, color);
      if (!result.success) continue;
      const captures = result.move?.captures ?? 0;
      const group = sandbox.getGroup(x, y);
      const liberties = sandbox.countLiberties(group);
      const center = (size - 1) / 2;
      const distance = Math.abs(center - x) + Math.abs(center - y);
      const score = captures * 5 + liberties - distance * 0.3 + Math.random() * 0.2;
      if (!best || score > best.score) {
        best = { x, y, score };
      }
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}
