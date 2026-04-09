import { useState } from 'react';
import './DecisionLog.css';

const TYPE_META = {
  decision: { label: 'Decision', color: '#7c6af7', bg: '#ede9ff', border: '#ddd8f8' },
  note:     { label: 'Note',     color: '#0d9488', bg: '#d1faf5', border: '#99f6e4' },
};

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DecisionLog({ logs = [], dispatch }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('decision');

  function handleAdd(e) {
    e.preventDefault();
    if (!content.trim()) return;
    dispatch({ type: 'ADD_LOG', payload: { type, content } });
    setContent('');
  }

  return (
    <aside className="dlog">
      <div className="dlog__header">
        <span className="dlog__title">Decision Log</span>
        <span className="dlog__count">{logs.length}</span>
      </div>

      <form className="dlog__form" onSubmit={handleAdd}>
        <div className="dlog__type-row">
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              className={`dlog__type-btn ${type === key ? 'dlog__type-btn--active' : ''}`}
              style={type === key ? { background: meta.bg, color: meta.color, borderColor: meta.border } : {}}
              onClick={() => setType(key)}
            >
              {meta.label}
            </button>
          ))}
        </div>
        <textarea
          className="dlog__textarea"
          placeholder={type === 'decision' ? 'What did you decide and why?' : 'Add a note or observation…'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd(e);
          }}
        />
        <button
          type="submit"
          className="dlog__submit"
          disabled={!content.trim()}
        >
          Add Entry
        </button>
      </form>

      <div className="dlog__list">
        {logs.length === 0 && (
          <p className="dlog__empty">No entries yet. Log decisions and notes to remember why you planned things this way.</p>
        )}
        {logs.map((log) => {
          const meta = TYPE_META[log.type] || TYPE_META.note;
          return (
            <div key={log.id} className="dlog__entry">
              <div className="dlog__entry-header">
                <span
                  className="dlog__entry-type"
                  style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                >
                  {meta.label}
                </span>
                <span className="dlog__entry-time">{formatTime(log.createdAt)}</span>
                <button
                  className="dlog__entry-del"
                  onClick={() => dispatch({ type: 'DELETE_LOG', payload: { id: log.id } })}
                  title="Delete"
                >
                  ×
                </button>
              </div>
              <p className="dlog__entry-content">{log.content}</p>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
