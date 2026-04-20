import { useState, useEffect } from 'react';
import './DashboardView.css';

const SECTIONS = [
  { key: 'eatFrog',    label: 'Eat that Frog',    emoji: '🐸', hint: 'Max 1 — most critical task today' },
  { key: 'product',    label: 'Product',           emoji: '📦' },
  { key: 'marketing',  label: 'Marketing',         emoji: '📣' },
  { key: 'personal',   label: 'Personal',          emoji: '👤' },
  { key: 'hobbies',    label: 'Hoblie Unposition', emoji: '🎨' },
  { key: 'rpmProject', label: 'Imp RPM Project',   emoji: '🎯' },
];

const ROUTINES = [
  { id: 'read',     label: 'Read',              duration: '60m' },
  { id: 'delegate', label: 'Delegate',          duration: '20m' },
  { id: 'review',   label: 'Review Tasks',      duration: '20m' },
  { id: 'kriya',    label: 'Kriya / Vipassana', duration: '60m' },
];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fmt12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function DashboardView({ dashboard = {}, tasks = [], people = [], dispatch }) {
  const db = {
    date: '', objective: '', sections: {}, meetings: [], teamFocus: {}, routines: {},
    ...dashboard,
  };

  const [objective, setObjective] = useState(db.objective);
  const [addingMeeting, setAddingMeeting] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetTime, setMeetTime] = useState('');

  useEffect(() => {
    const today = todayStr();
    if (db.date !== today) {
      dispatch({ type: 'SET_DASHBOARD_DATE', payload: { date: today } });
    }
  }, []);

  useEffect(() => {
    if (objective === db.objective) return;
    const t = setTimeout(() => {
      dispatch({ type: 'SET_DASHBOARD_OBJECTIVE', payload: { objective } });
    }, 600);
    return () => clearTimeout(t);
  }, [objective]);

  // Sync if dashboard.objective changes externally (e.g. date reset)
  useEffect(() => { setObjective(db.objective); }, [db.objective]);

  function addMeeting(e) {
    e.preventDefault();
    if (!meetTitle.trim()) return;
    dispatch({ type: 'ADD_MEETING', payload: { title: meetTitle.trim(), time: meetTime } });
    setMeetTitle(''); setMeetTime(''); setAddingMeeting(false);
  }

  const routines = db.routines || {};
  const sections = db.sections || {};
  const meetings = [...(db.meetings || [])].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const teamFocus = db.teamFocus || {};
  const doneRoutines = ROUTINES.filter((r) => routines[r.id]).length;

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash__header">
        <div>
          <div className="dash__tag">TODAY'S FOCUS</div>
          <div className="dash__date">{formatDate()}</div>
        </div>
        <div className="dash__routine-summary">
          <span className="dash__routine-count">{doneRoutines}/{ROUTINES.length}</span>
          <span className="dash__routine-label">routines done</span>
        </div>
      </div>

      {/* Objective */}
      <textarea
        className="dash__objective"
        placeholder="Today's objective — what do you want to achieve? Write your intention for the day..."
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        rows={2}
      />

      {/* Daily Routines */}
      <div className="dash__routines">
        {ROUTINES.map((r) => (
          <button
            key={r.id}
            className={`dash__routine ${routines[r.id] ? 'dash__routine--done' : ''}`}
            onClick={() => dispatch({ type: 'TOGGLE_ROUTINE', payload: { routineId: r.id } })}
          >
            <span className="dash__routine-check">{routines[r.id] ? '✓' : '○'}</span>
            <span className="dash__routine-name">{r.label}</span>
            <span className="dash__routine-dur">{r.duration}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="dash__body">
        {/* Focus Areas */}
        <div className="dash__focus">
          <div className="dash__col-head">Focus Areas</div>
          {SECTIONS.map((sec) => {
            const selectedTask = tasks.find((t) => t.id === sections[sec.key]);
            return (
              <div key={sec.key} className={`dash__sec ${sec.key === 'eatFrog' ? 'dash__sec--frog' : ''}`}>
                <div className="dash__sec-left">
                  <span className="dash__sec-emoji">{sec.emoji}</span>
                  <div>
                    <div className="dash__sec-label">{sec.label}</div>
                    {sec.hint && <div className="dash__sec-hint">{sec.hint}</div>}
                  </div>
                </div>
                <select
                  className="dash__sec-select"
                  value={sections[sec.key] || ''}
                  title={selectedTask ? selectedTask.name : ''}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_SECTION_TASK',
                      payload: { section: sec.key, taskId: e.target.value || null },
                    })
                  }
                >
                  <option value="">— pick a task —</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Right: Meetings + Team Focus */}
        <div className="dash__right">
          {/* Meetings */}
          <div className="dash__card">
            <div className="dash__card-head">
              <span className="dash__col-head" style={{ margin: 0 }}>📅 Meetings</span>
              {!addingMeeting && (
                <button className="dash__add-btn" onClick={() => setAddingMeeting(true)}>+ Add</button>
              )}
            </div>
            {addingMeeting && (
              <form className="dash__meet-form" onSubmit={addMeeting}>
                <input
                  autoFocus
                  className="dash__meet-title-input"
                  placeholder="Meeting title..."
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                />
                <div className="dash__meet-row">
                  <input
                    className="dash__meet-time-input"
                    type="time"
                    value={meetTime}
                    onChange={(e) => setMeetTime(e.target.value)}
                  />
                  <button type="submit" className="dash__meet-save">Add</button>
                  <button type="button" className="dash__meet-cancel" onClick={() => { setAddingMeeting(false); setMeetTitle(''); setMeetTime(''); }}>×</button>
                </div>
              </form>
            )}
            {meetings.length === 0 && !addingMeeting && (
              <p className="dash__empty">No meetings today</p>
            )}
            {meetings.map((m) => (
              <div key={m.id} className="dash__meet-item">
                {m.time && <span className="dash__meet-badge">{fmt12h(m.time)}</span>}
                <span className="dash__meet-name" title={m.title}>{m.title}</span>
                <button
                  className="dash__meet-del"
                  onClick={() => dispatch({ type: 'DELETE_MEETING', payload: { id: m.id } })}
                >×</button>
              </div>
            ))}
          </div>

          {/* Team Focus */}
          {people.length > 0 && (
            <div className="dash__card">
              <div className="dash__card-head">
                <span className="dash__col-head" style={{ margin: 0 }}>👥 Team Focus</span>
              </div>
              {people.map((person) => {
                const sel = tasks.find((t) => t.id === teamFocus[person.id]);
                return (
                  <div key={person.id} className="dash__team-row">
                    <span className="dash__team-avatar">{person.name[0]?.toUpperCase()}</span>
                    <span className="dash__team-name" title={person.name}>{person.name}</span>
                    <select
                      className="dash__sec-select"
                      value={teamFocus[person.id] || ''}
                      title={sel ? sel.name : ''}
                      onChange={(e) =>
                        dispatch({
                          type: 'SET_TEAM_FOCUS',
                          payload: { personId: person.id, taskId: e.target.value || null },
                        })
                      }
                    >
                      <option value="">— pick a task —</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
