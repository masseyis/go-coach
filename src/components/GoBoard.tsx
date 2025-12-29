import type { Intersection, StoneColor } from "../types/go";

const LETTERS = "ABCDEFGHJKLMNOPQRST";

export type Props = {
  board: Intersection[][];
  allowMoves: boolean;
  onPlay: (x: number, y: number) => void;
  size: number;
  turn: StoneColor;
  lastMove?: string;
};

export function GoBoard({ board, allowMoves, onPlay, size, turn, lastMove }: Props) {
  return (
    <div className="go-board-wrapper">
      <div className="go-board" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {board.map((row, y) =>
          row.map((cell, x) => {
            const coord = `${LETTERS[x]}${size - y}`;
            const isLast = lastMove === coord;
            return (
              <button
                key={`${x}-${y}`}
                className={`go-point ${cell ?? "empty"} ${isLast ? "last-move" : ""}`}
                disabled={!allowMoves}
                onClick={() => onPlay(x, y)}
                aria-label={`Intersection ${coord}`}
              >
                {cell === "black" && <span className="stone black" />}
                {cell === "white" && <span className="stone white" />}
                {!cell && <span className="stone placeholder" />}
              </button>
            );
          }),
        )}
      </div>
      <p className="muted">Turn: {turn === "black" ? "Black (you)" : "White"}</p>
    </div>
  );
}
