import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import TaskChip from '../TaskChip/TaskChip';
import './TaskPool.css';

const PRIORITY_OPTIONS = ['High', 'Med', 'Low'];

export default function TaskPool({ tasks, dispatch, completedToday }) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('High');

  const { setNodeRef, isOver } = useDroppable({ id: 'pool' });

  const count = completedToday?.count ?? 0;

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'ADD_TASK', payload: { name, priority } });
    setName('');
  }

  const sorted = [...tasks].sort((a, b) => {
    const order = { High: 0, Med: 1, Low: 2 };
    return order[a.priority] - order[b.priority] || a.createdAt - b.createdAt;
  });

  return (
    <aside className="task-pool">
      <div className="task-pool__header">
        <span className="task-pool__title">Task Pool</span>
        {tasks.length > 0 && (
          <span className="task-pool__badge">{tasks.length}</span>
        )}
      </div>

      {count > 0 && (
        <div className="task-pool__done-today">
          ✓ {count} done today
        </div>
      )}

      <form className="task-pool__form" onSubmit={handleAdd}>
        <input
          className="task-pool__input"
          type="text"
          placeholder="New task…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
        <div className="task-pool__form-row">
          <select
            className="task-pool__select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            className="task-pool__add-btn"
            type="submit"
            disabled={!name.trim()}
          >
            + Add
          </button>
        </div>
      </form>

      <div
        ref={setNodeRef}
        className={`task-pool__list ${isOver ? 'task-pool__list--over' : ''}`}
      >
        {sorted.length === 0 && (
          <div className="task-pool__empty">
            {isOver ? 'Drop to unassign' : 'No tasks yet'}
          </div>
        )}
        {sorted.map((task) => (
          <TaskChip
            key={task.id}
            task={task}
            dispatch={dispatch}
            onComplete={() =>
              dispatch({ type: 'COMPLETE_TASK', payload: { id: task.id } })
            }
            onDelete={() =>
              dispatch({ type: 'DELETE_TASK', payload: { id: task.id } })
            }
          />
        ))}
        {sorted.length > 0 && isOver && (
          <div className="task-pool__drop-hint">Drop to unassign</div>
        )}
      </div>
    </aside>
  );
}
