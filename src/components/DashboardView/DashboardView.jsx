import { useState, useEffect } from 'react';
import { PRIORITY_COLORS } from '../../utils/rpmReducer';
import './DashboardView.css';

const SECTIONS = [
  { key: 'eatFrog',    label: 'Eat that Frog',    emoji: '🐸', single: true, hint: 'Max 1 — most critical task today' },
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

function toArr(val) {
  if (!val) return [];
  if (typeof val === 'string') return [val]; // migrate old single value
  return Array.isArray(val) ? val : [];
}

// ── Search dropdown to add tasks ──────────────────────────────
function TaskSearchPicker({ tasks, excludeIds = [], onAdd, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const options = tasks
    .filter((t) => !excludeIds.includes(t.id))
    .filter((t) => !query || t.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="tpicker">
      <input
        className="tpicker__input"
        placeholder={placeholder || '+ Add task…'}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div className="tpicker__dropdown">
          {options.length > 0 ? options.map((t) => (
            <button
              key={t.id}
              className="tpicker__option"
              onMouseDown={(e) => { e.preventDefault(); onAdd(t.id); setQuery(''); setOpen(false); }}
            >
              <span className="tpicker__dot" style={{ background: PRIORITY_COLORS[t.priority] }} />
              <span className="tpicker__name">{t.name}</span>
            </button>
          )) : (
            <div className="tpicker__empty">
              {query ? 'No matching tasks' : 'All tasks already added'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Single task row with complete + remove ────────────────────
function TaskRow({ task, onComplete, onRemove, isFrog }) {
  return (
    <div className={`dash__task-row ${isFrog ? 'dash__task-row--frog' : ''}`}>
      <span className="dash__task-dot" style={{ background: PRIORITY_COLORS[task.priority] }} />
      <span className="dash__task-name" title={task.name}>{task.name}</span>
      <div className="dash__task-btns">
        <button className="dash__task-done" onClick={onComplete} title="Mark complete">✓</button>
        <button className="dash__task-rm" onClick={onRemove} title="Remove">×</button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function DashboardView({ dashboard = {}, tasks = [], people = [], dispatch }) {
  const db = {
    date: '', objective: '', sections: {}, meetings: [],
    teamFocus: {}, routines: {}, reviewToday: [],
    ...dashboard,
  };

  const [objective, setObjective] = useState(db.objective);
  const [addingMeeting, setAddingMeeting] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetTime, setMeetTime] = useState('');

  // Daily reset if date changed
  useEffect(() => {
    if (db.date !== todayStr()) {
      dispatch({ type: 'SET_DASHBOARD_DATE', payload: { date: todayStr() } });
    }
  }, []);

  // Debounced objective save
  useEffect(() => {
    if (objective === db.objective) return;
    const t = setTimeout(() => {
      dispatch({ type: 'SET_DASHBOARD_OBJECTIVE', payload: { objective } });
    }, 600);
    return () => clearTimeout(t);
  }, [objective]);

  useEffect(() => { setObjective(db.objective); }, [db.objective]);

  function addMeeting(e) {
    e.preventDefault();
    if (!meetTitle.trim()) return;
    dispatch({ type: 'ADD_MEETING', payload: { title: meetTitle.trim(), time: meetTime } });
    setMeetTitle(''); setMeetTime(''); setAddingMeeting(false);
  }

  const routines  = db.routines  || {};
  const sections  = db.sections  || {};
  const teamFocus = db.teamFocus || {};
  const reviewToday = toArr(db.reviewToday);
  const meetings  = [...(db.meetings || [])].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const doneRoutines = ROUTINES.filter((r) => routines[r.id]).length;

  const delegatedIds  = new Set(people.flatMap((p) => p.taskIds));
  const delegatedTasks = tasks.filter((t) => delegatedIds.has(t.id));

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

      {/* Body grid */}
      <div className="dash__body">

        {/* ── Left: Focus Areas ── */}
        <div className="dash__focus">
          <div className="dash__col-head">Focus Areas</div>

          {SECTIONS.map((sec) => {
            if (sec.single) {
              // Eat that Frog — max 1 task
              const frogTask = tasks.find((t) => t.id === sections[sec.key]);
              return (
                <div key={sec.key} className="dash__sec dash__sec--frog">
                  <div className="dash__sec-hd">
                    <span className="dash__sec-emoji">{sec.emoji}</span>
                    <div>
                      <div className="dash__sec-label">{sec.label}</div>
                      <div className="dash__sec-hint">{sec.hint}</div>
                    </div>
                  </div>
                  <div className="dash__sec-body">
                    {frogTask ? (
                      <TaskRow
                        task={frogTask}
                        isFrog
                        onComplete={() => dispatch({ type: 'COMPLETE_TASK', payload: { id: frogTask.id } })}
                        onRemove={() => dispatch({ type: 'SET_SECTION_TASK', payload: { section: sec.key, taskId: null } })}
                      />
                    ) : (
                      <TaskSearchPicker
                        tasks={tasks}
                        excludeIds={[]}
                        onAdd={(taskId) => dispatch({ type: 'SET_SECTION_TASK', payload: { section: sec.key, taskId } })}
                        placeholder="Search your #1 task for today…"
                      />
                    )}
                  </div>
                </div>
              );
            }

            // Multi-task sections
            const taskIds    = toArr(sections[sec.key]);
            const secTasks   = taskIds.map((id) => tasks.find((t) => t.id === id)).filter(Boolean);

            return (
              <div key={sec.key} className="dash__sec">
                <div className="dash__sec-hd">
                  <span className="dash__sec-emoji">{sec.emoji}</span>
                  <span className="dash__sec-label">{sec.label}</span>
                  {secTasks.length > 0 && (
                    <span className="dash__sec-count">{secTasks.length}</span>
                  )}
                </div>
                <div className="dash__sec-body">
                  {secTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onComplete={() => dispatch({ type: 'COMPLETE_TASK', payload: { id: task.id } })}
                      onRemove={() => dispatch({ type: 'REMOVE_SECTION_TASK', payload: { section: sec.key, taskId: task.id } })}
                    />
                  ))}
                  <TaskSearchPicker
                    tasks={tasks}
                    excludeIds={taskIds}
                    onAdd={(taskId) => dispatch({ type: 'ADD_SECTION_TASK', payload: { section: sec.key, taskId } })}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Right: Meetings + Review + Team ── */}
        <div className="dash__right">

          {/* Meetings */}
          <div className="dash__card">
            <div className="dash__card-hd">
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
                  <button type="button" className="dash__meet-cancel"
                    onClick={() => { setAddingMeeting(false); setMeetTitle(''); setMeetTime(''); }}>×</button>
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
                <button className="dash__meet-del"
                  onClick={() => dispatch({ type: 'DELETE_MEETING', payload: { id: m.id } })}>×</button>
              </div>
            ))}
          </div>

          {/* To Review Today */}
          <div className="dash__card">
            <div className="dash__card-hd">
              <span className="dash__col-head" style={{ margin: 0 }}>🔍 To Review Today</span>
              {reviewToday.length > 0 && (
                <span className="dash__review-count">{reviewToday.length}</span>
              )}
            </div>
            {delegatedTasks.length === 0 ? (
              <p className="dash__empty">No delegated tasks — add people & delegate first</p>
            ) : (
              <>
                {reviewToday.map((taskId) => {
                  const task   = tasks.find((t) => t.id === taskId);
                  if (!task) return null;
                  const person = people.find((p) => p.taskIds.includes(taskId));
                  return (
                    <div key={taskId} className="dash__review-row">
                      {person && (
                        <span className="dash__review-avatar" title={person.name}>
                          {person.name[0].toUpperCase()}
                        </span>
                      )}
                      <span className="dash__review-name" title={task.name}>{task.name}</span>
                      <div className="dash__task-btns">
                        <button className="dash__task-done" title="Mark complete"
                          onClick={() => dispatch({ type: 'COMPLETE_TASK', payload: { id: taskId } })}>✓</button>
                        <button className="dash__task-rm" title="Remove from review"
                          onClick={() => dispatch({ type: 'REMOVE_REVIEW_TASK', payload: { taskId } })}>×</button>
                      </div>
                    </div>
                  );
                })}
                <TaskSearchPicker
                  tasks={delegatedTasks}
                  excludeIds={reviewToday}
                  onAdd={(taskId) => dispatch({ type: 'ADD_REVIEW_TASK', payload: { taskId } })}
                  placeholder="Add delegated task to review…"
                />
              </>
            )}
          </div>

          {/* Team Focus */}
          {people.length > 0 && (
            <div className="dash__card">
              <div className="dash__card-hd">
                <span className="dash__col-head" style={{ margin: 0 }}>👥 Team Focus</span>
              </div>
              {people.map((person, idx) => {
                const personTasks  = tasks.filter((t) => person.taskIds.includes(t.id));
                const selectedIds  = toArr(teamFocus[person.id]);
                const selectedTasks = selectedIds.map((id) => tasks.find((t) => t.id === id)).filter(Boolean);
                return (
                  <div key={person.id} className={`dash__person-block ${idx > 0 ? 'dash__person-block--sep' : ''}`}>
                    <div className="dash__person-hd">
                      <span className="dash__team-avatar">{person.name[0]?.toUpperCase()}</span>
                      <span className="dash__team-name" title={person.name}>{person.name}</span>
                      {selectedTasks.length > 0 && (
                        <span className="dash__sec-count">{selectedTasks.length}</span>
                      )}
                    </div>
                    {selectedTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onComplete={() => dispatch({ type: 'COMPLETE_TASK', payload: { id: task.id } })}
                        onRemove={() => dispatch({ type: 'REMOVE_TEAM_FOCUS_TASK', payload: { personId: person.id, taskId: task.id } })}
                      />
                    ))}
                    {personTasks.length === 0 ? (
                      <p className="dash__empty" style={{ textAlign: 'left' }}>No tasks delegated yet</p>
                    ) : (
                      <TaskSearchPicker
                        tasks={personTasks}
                        excludeIds={selectedIds}
                        onAdd={(taskId) => dispatch({ type: 'ADD_TEAM_FOCUS_TASK', payload: { personId: person.id, taskId } })}
                        placeholder={`Add task for ${person.name}…`}
                      />
                    )}
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
