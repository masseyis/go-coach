import type { GoMove } from "../types/go";

type Props = {
  moves: GoMove[];
};

export function MoveList({ moves }: Props) {
  return (
    <div className="move-list">
      <div className="move-list-header">
        <span>#</span>
        <span>Color</span>
        <span>Move</span>
      </div>
      <div className="move-list-body">
        {moves.map((move) => (
          <div key={move.moveNumber} className="move-row">
            <span>{move.moveNumber}</span>
            <span>{move.color}</span>
            <span>
              {move.coordinate}
              {move.captures > 0 && <em> (×{move.captures})</em>}
            </span>
          </div>
        ))}
        {moves.length === 0 && <p className="muted">No moves yet.</p>}
      </div>
    </div>
  );
}
