import type { GoCoachResponse } from "../types/go";

type Props = {
  feedback: GoCoachResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  disabled?: boolean;
};

export function CoachPanel({ feedback, loading, error, onRefresh, disabled }: Props) {
  return (
    <div className="coach-panel">
      <div className="panel-header">
        <div>
          <div className="panel-label">Coach feedback</div>
          <p className="muted small">AI looks at your last move and shares a tip.</p>
        </div>
        <button className="primary-btn" onClick={onRefresh} disabled={loading || disabled}>
          {loading ? "Thinking..." : "Ask coach"}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
      {feedback ? (
        <div>
          <p>{feedback.comment}</p>
          <p className="muted">Focus: {feedback.focus}</p>
          {feedback.suggestion && <p className="muted">Suggestion: {feedback.suggestion}</p>}
        </div>
      ) : (
        <p className="muted">Make a move and tap "Ask coach" for guidance.</p>
      )}
    </div>
  );
}
