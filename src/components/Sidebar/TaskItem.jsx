import { PRIORITY_COLORS } from '../../utils/taskReducer';
import { formatTimeSpent } from '../../hooks/useTimer';
import './TaskItem.css';

export default function TaskItem({ task, dispatch, isActive }) {
  return (
    <div className={`task-item ${isActive ? 'task-item--active' : ''}`}>
      <label className="task-item__check-label">
        <input
          type="checkbox"
          className="task-item__checkbox"
          onChange={() =>
            dispatch({ type: 'COMPLETE_TASK', payload: { id: task.id } })
          }
        />
        <span className="task-item__checkmark" />
      </label>

      <div className="task-item__body">
        <span className="task-item__name">{task.name}</span>
        <div className="task-item__meta">
          <span
            className="task-item__badge"
            style={{ background: PRIORITY_COLORS[task.priority] }}
          >
            {task.priority}
          </span>
          {task.timeSpent > 0 && (
            <span className="task-item__time">
              ⏱ {formatTimeSpent(task.timeSpent)}
            </span>
          )}
        </div>
      </div>

      <button
        className="task-item__delete"
        onClick={() => dispatch({ type: 'DELETE_TASK', payload: { id: task.id } })}
        title="Delete task"
        aria-label="Delete task"
      >
        ×
      </button>
    </div>
  );
}
