import { useState } from "react";

import "../App.css";

type Props = {
  apiKey: string | null;
  onSave: (value: string) => Promise<void> | void;
  onClear: () => Promise<void> | void;
  loading?: boolean;
};

export function ApiKeyManager({ apiKey, onSave, onClear, loading }: Props) {
  const [draft, setDraft] = useState("");

  const handleSave = () => {
    if (!draft.trim()) return;
    onSave(draft.trim());
    setDraft("");
  };

  return (
    <div className="api-key-card">
      <div className="api-key-header">
        <div>
          <h2 className="panel-label">OpenAI key</h2>
          <p className="api-key-hint">Needed for personalized coaching and drills.</p>
        </div>
        {apiKey && (
          <button className="secondary-btn" onClick={() => onClear()}>
            Remove
          </button>
        )}
      </div>
      {loading ? (
        <p className="muted">Loading key...</p>
      ) : apiKey ? (
        <p className="muted">Key saved locally. You can revoke it anytime.</p>
      ) : (
        <div className="api-key-editor">
          <input
            className="api-key-input"
            type="password"
            placeholder="sk-..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="primary-btn" onClick={handleSave} disabled={!draft.trim()}>
            Save key
          </button>
        </div>
      )}
    </div>
  );
}
