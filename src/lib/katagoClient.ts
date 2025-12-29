import type { StoneColor } from "../types/go";

const ENDPOINT = (import.meta.env.VITE_KATAGO_SERVER_URL ?? "").replace(/\/$/, "");

export type KataGoMoveChoice = {
  move: string;
  visits?: number;
  winrate?: number;
  scoreLead?: number;
};

export type KataGoResponse = {
  moves: KataGoMoveChoice[];
  winrate?: number;
  scoreLead?: number;
};

export const isKataGoConfigured = () => Boolean(ENDPOINT);

export async function requestKataGoMove(options: {
  boardSize: number;
  moves: string[];
  nextPlayer: StoneColor;
}): Promise<{ bestMove: KataGoMoveChoice; raw: KataGoResponse }> {
  if (!ENDPOINT) {
    throw new Error("KataGo server URL is not configured");
  }

  const payload = {
    moves: options.moves,
    board_size: options.boardSize,
    next_player: options.nextPlayer,
  };

  const response = await fetch(`${ENDPOINT}/select-move/katago_gtp_bot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`KataGo server error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as KataGoResponse;
  const bestMove = data.moves?.[0];
  if (!bestMove?.move) {
    throw new Error("KataGo response did not include a move");
  }

  return { bestMove, raw: data };
}
