import { useReducer, useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { rpmReducer, initialState, getUncategorized, PRIORITY_COLORS } from './utils/rpmReducer';
import { useLocalStorage } from './hooks/useLocalStorage';
import TaskPool from './components/TaskPool/TaskPool';
import GoalCard from './components/GoalCard/GoalCard';
import PersonCard from './components/PersonCard/PersonCard';
import SpinModal from './components/SpinModal/SpinModal';
import DecisionLog from './components/DecisionLog/DecisionLog';
import './App.css';

const STORAGE_KEY = 'funwithtasks_v3';

const COMPLETION_MESSAGES = [
  'First one down. Let\'s keep the momentum!',
  'Two done. You\'re building a streak!',
  'Three tasks cleared. You\'re on a roll!',
  'Four down. Deep focus is your superpower.',
  'Five tasks! You\'re absolutely crushing it.',
  'Six done. The best version of you showed up today.',
  'Seven tasks cleared. Legendary work ethic.',
  'Eight down. You\'re in the zone — stay there!',
  'Nine tasks! You make it look effortless.',
  'Ten tasks completed. Hall of fame performance.',
];

export default function App() {
  const [persistedState, setPersistedState] = useLocalStorage(STORAGE_KEY, initialState);
  const [state, dispatch] = useReducer(rpmReducer, { ...initialState, ...persistedState });
  const [spinOpen, setSpinOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [addingPerson, setAddingPerson] = useState(false);
  const [activeTask, setActiveTask] = useState(null); // drag overlay task

  // Patch: handle _ADD_AND_ASSIGN composite action via useEffect
  // (GoalCard dispatches this; we intercept it here)
  const patchedDispatch = (action) => {
    if (action.type === '_ADD_AND_ASSIGN') {
      dispatch({
        type: '_ASSIGN_NEW',
        payload: { name: action.payload.name, priority: action.payload.priority, goalId: action.payload.goalId },
      });
    } else {
      dispatch(action);
    }
  };

  useEffect(() => { setPersistedState(state); }, [state]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event) {
    const task = state.tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null);
    if (!over) return;
    const taskId = active.id;

    if (over.id === 'pool') {
      dispatch({ type: 'UNASSIGN_TASK', payload: { taskId } });
    } else if (over.id.startsWith('goal-')) {
      dispatch({ type: 'ASSIGN_TASK', payload: { taskId, dest: { type: 'goal', id: over.id.slice(5) } } });
    } else if (over.id.startsWith('person-')) {
      dispatch({ type: 'ASSIGN_TASK', payload: { taskId, dest: { type: 'person', id: over.id.slice(7) } } });
    }
  }

  function handleAddPerson(e) {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    dispatch({ type: 'ADD_PERSON', payload: { name: newPersonName } });
    setNewPersonName('');
    setAddingPerson(false);
  }

  const uncategorized = getUncategorized(state);
  const completedCount = state.completedToday?.count ?? 0;
  const completionMsg = completedCount > 0
    ? COMPLETION_MESSAGES[(completedCount - 1) % COMPLETION_MESSAGES.length]
    : null;

  const spinItemCount =
    uncategorized.length +
    state.goals.filter((g) => g.taskIds.length > 0).length +
    (state.people.some((p) => p.taskIds.length > 0) ? 1 : 0);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="app">
        {/* ── Task Pool (left) ─────────────────────────────── */}
        <TaskPool
          tasks={uncategorized}
          dispatch={patchedDispatch}
          completedToday={state.completedToday}
        />

        {/* ── RPM Board (main) ─────────────────────────────── */}
        <main className="rpm-board">
          <div className="rpm-board__header">
            <div className="rpm-board__title-row">
              <h1 className="rpm-board__title">RPM Board</h1>
              {completedCount > 0 && (
                <div className="rpm-board__done">
                  <span className="rpm-board__done-count">✓ {completedCount} done</span>
                  {completionMsg && (
                    <span className="rpm-board__done-msg">{completionMsg}</span>
                  )}
                </div>
              )}
            </div>

            <button
              className="spin-card"
              onClick={() => setSpinOpen(true)}
            >
              <span className="spin-card__icon">🎯</span>
              <div className="spin-card__text">
                <span className="spin-card__title">Spin Tasks</span>
                <span className="spin-card__sub">
                  {spinItemCount > 0 ? `${spinItemCount} items in play` : 'Add tasks to play'}
                </span>
              </div>
            </button>
          </div>

          {/* ── Goals row ──────────────────────────────────── */}
          <section className="rpm-board__section">
            <div className="rpm-board__section-header">
              <span className="rpm-board__section-label">Goals</span>
              <button
                className="rpm-board__add-btn"
                onClick={() => dispatch({ type: 'ADD_GOAL', payload: { title: 'New Goal' } })}
              >
                + New Goal
              </button>
            </div>
            <div className="rpm-board__cards">
              {state.goals.length === 0 && (
                <div className="rpm-board__empty">
                  Create goals, then drag tasks from the pool into them.
                </div>
              )}
              {state.goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  tasks={state.tasks}
                  dispatch={patchedDispatch}
                />
              ))}
            </div>
          </section>

          {/* ── People / Delegation row ─────────────────────── */}
          <section className="rpm-board__section">
            <div className="rpm-board__section-header">
              <span className="rpm-board__section-label">Delegated To</span>
              {!addingPerson ? (
                <button
                  className="rpm-board__add-btn"
                  onClick={() => setAddingPerson(true)}
                >
                  + Add Person
                </button>
              ) : (
                <form className="rpm-board__person-form" onSubmit={handleAddPerson}>
                  <input
                    className="rpm-board__person-input"
                    autoFocus
                    placeholder="Name…"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setAddingPerson(false); }}
                  />
                  <button type="submit" className="rpm-board__person-submit">Add</button>
                  <button type="button" className="rpm-board__person-cancel" onClick={() => setAddingPerson(false)}>×</button>
                </form>
              )}
            </div>
            <div className="rpm-board__cards">
              {state.people.length === 0 && (
                <div className="rpm-board__empty">
                  Add people and drag tasks to delegate.
                </div>
              )}
              {state.people.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  tasks={state.tasks}
                  dispatch={patchedDispatch}
                />
              ))}
            </div>
          </section>
        </main>

        {/* ── Decision Log (right) ─────────────────────────── */}
        <DecisionLog logs={state.logs ?? []} dispatch={dispatch} />
      </div>

      {/* Drag Overlay — ghost chip while dragging */}
      <DragOverlay>
        {activeTask && (
          <div className="drag-overlay-chip">
            <span
              className="drag-overlay-chip__dot"
              style={{ background: PRIORITY_COLORS[activeTask.priority] }}
            />
            {activeTask.name}
          </div>
        )}
      </DragOverlay>

      {spinOpen && (
        <SpinModal
          state={state}
          dispatch={patchedDispatch}
          onClose={() => setSpinOpen(false)}
        />
      )}
    </DndContext>
  );
}
