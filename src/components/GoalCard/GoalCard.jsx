import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import TaskChip from '../TaskChip/TaskChip';
import './GoalCard.css';

export default function GoalCard({ goal, tasks, dispatch }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(goal.title);
  const [expanded, setExpanded] = useState(false);
  const [what, setWhat] = useState(goal.what);
  const [why, setWhy] = useState(goal.why);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [newActionPriority, setNewActionPriority] = useState('High');

  const { setNodeRef, isOver } = useDroppable({ id: `goal-${goal.id}` });

  const goalTasks = goal.taskIds
    .map((id) => tasks.find((t) => t.id === id))
    .filter(Boolean);

  function saveTitle() {
    if (titleVal.trim()) {
      dispatch({ type: 'UPDATE_GOAL', payload: { id: goal.id, patch: { title: titleVal.trim() } } });
    }
    setEditingTitle(false);
  }

  function saveWhatWhy() {
    dispatch({ type: 'UPDATE_GOAL', payload: { id: goal.id, patch: { what, why } } });
    setExpanded(false);
  }

  function setMassAction(taskId) {
    dispatch({ type: 'UPDATE_GOAL', payload: { id: goal.id, patch: { massActionTaskId: taskId } } });
    setShowActionPicker(false);
  }

  function addNewAction() {
    if (!newActionName.trim()) return;
    const id = crypto.randomUUID();
    // Add the task globally, then assign to this goal
    dispatch({ type: 'ADD_TASK', payload: { name: newActionName, priority: newActionPriority } });
    // We need the id we just generated — but since we can't get return value from dispatch,
    // we'll add + assign in one shot via a composite action
    dispatch({
      type: '_ADD_AND_ASSIGN',
      payload: { name: newActionName, priority: newActionPriority, goalId: goal.id },
    });
    setNewActionName('');
    setShowActionPicker(false);
  }

  return (
    <div className={`goal-card ${isOver ? 'goal-card--over' : ''}`}>
      <div className="goal-card__header">
        {editingTitle ? (
          <input
            className="goal-card__title-input"
            value={titleVal}
            autoFocus
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
          />
        ) : (
          <span
            className="goal-card__title"
            onClick={() => { setEditingTitle(true); setTitleVal(goal.title); }}
            title="Click to edit"
          >
            {goal.title}
          </span>
        )}
        <div className="goal-card__header-actions">
          <button
            className={`goal-card__expand-btn ${expanded ? 'goal-card__expand-btn--open' : ''}`}
            onClick={() => setExpanded((v) => !v)}
            title="What & Why"
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            className="goal-card__delete-btn"
            onClick={() => dispatch({ type: 'DELETE_GOAL', payload: { id: goal.id } })}
            title="Delete goal"
          >
            ×
          </button>
        </div>
      </div>

      {expanded && (
        <div className="goal-card__form">
          <label className="goal-card__label">What exactly needs to be achieved?</label>
          <textarea
            className="goal-card__textarea"
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            rows={3}
            placeholder="Describe the outcome…"
          />
          <label className="goal-card__label">Why?</label>
          <textarea
            className="goal-card__textarea"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={2}
            placeholder="The deeper reason…"
          />
          <button className="goal-card__save-btn" onClick={saveWhatWhy}>Save</button>
        </div>
      )}

      {!expanded && (goal.what || goal.why) && (
        <div className="goal-card__preview">
          {goal.what && <p className="goal-card__preview-what">"{goal.what}"</p>}
          {goal.why && <p className="goal-card__preview-why">→ {goal.why}</p>}
        </div>
      )}

      <div
        ref={setNodeRef}
        className={`goal-card__tasks ${isOver ? 'goal-card__tasks--over' : ''}`}
      >
        {goalTasks.length === 0 && (
          <div className="goal-card__drop-hint">
            {isOver ? 'Drop task here' : 'Drag tasks here'}
          </div>
        )}
        {goalTasks.map((task) => (
          <TaskChip
            key={task.id}
            task={task}
            dispatch={dispatch}
            isMassAction={task.id === goal.massActionTaskId}
            onComplete={() =>
              dispatch({ type: 'COMPLETE_TASK', payload: { id: task.id } })
            }
            onUnassign={() =>
              dispatch({ type: 'UNASSIGN_TASK', payload: { taskId: task.id } })
            }
          />
        ))}
      </div>

      <div className="goal-card__footer">
        {!showActionPicker ? (
          <button
            className="goal-card__action-btn"
            onClick={() => setShowActionPicker(true)}
          >
            {goal.massActionTaskId ? '⭐ Change action' : '+ Set action'}
          </button>
        ) : (
          <div className="goal-card__action-picker">
            <p className="goal-card__action-label">Pick the #1 action:</p>
            {goalTasks.map((task) => (
              <button
                key={task.id}
                className={`goal-card__action-option ${
                  task.id === goal.massActionTaskId ? 'goal-card__action-option--active' : ''
                }`}
                onClick={() => setMassAction(task.id)}
              >
                {task.name}
              </button>
            ))}
            <div className="goal-card__action-new">
              <input
                className="goal-card__action-input"
                placeholder="Or add new task…"
                value={newActionName}
                onChange={(e) => setNewActionName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addNewAction(); }}
              />
              <select
                className="goal-card__action-select"
                value={newActionPriority}
                onChange={(e) => setNewActionPriority(e.target.value)}
              >
                <option value="High">H</option>
                <option value="Med">M</option>
                <option value="Low">L</option>
              </select>
              <button className="goal-card__action-add" onClick={addNewAction}>+</button>
            </div>
            <button
              className="goal-card__action-cancel"
              onClick={() => setShowActionPicker(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
