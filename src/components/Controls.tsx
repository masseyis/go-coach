import type { ChangeEvent } from "react";

import type { StoneColor } from "../types/go";

type Props = {
  boardSize: number;
  onBoardSizeChange: (size: number) => void;
  onNewGame: () => void;
  onPass: () => void;
  onSwapSides: () => void;
  humanColor: StoneColor;
};

const SIZE_OPTIONS = [9, 13, 19];

export function Controls({ boardSize, onBoardSizeChange, onNewGame, onPass, onSwapSides, humanColor }: Props) {
  const handleSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onBoardSizeChange(Number(event.target.value));
  };

  return (
    <div className="controls-panel">
      <label className="select-label">
        Board size
        <select value={boardSize} onChange={handleSizeChange} className="control-select">
          {SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}×{size}
            </option>
          ))}
        </select>
      </label>
      <button className="primary-btn" onClick={onNewGame}>
        New game
      </button>
      <button className="secondary-btn" onClick={onPass}>
        Pass
      </button>
      <button className="secondary-btn" onClick={onSwapSides}>
        Play as {humanColor === "black" ? "White" : "Black"}
      </button>
    </div>
  );
}
