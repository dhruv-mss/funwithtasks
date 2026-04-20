import { PRIORITY_COLORS } from '../../utils/rpmReducer';
import './PostSpinPanel.css';

export default function PostSpinPanel({ task, onSpinAgain, onStartTimer }) {
  return (
    <div className="post-spin">
      <div className="post-spin__selected">
        <span className="post-spin__label">Selected</span>
        <div className="post-spin__task-name">{task.name}</div>
        <span
          className="post-spin__priority"
          style={{ background: PRIORITY_COLORS[task.priority] }}
        >
          {task.priority} Priority
        </span>
      </div>

      <div className="post-spin__section">
        <p className="post-spin__section-label">Focus session</p>
        <div className="post-spin__timer-btns">
          {[15, 30, 60].map((min) => (
            <button
              key={min}
              className="post-spin__timer-btn"
              onClick={() => onStartTimer(task.id, min * 60)}
            >
              {min}m
            </button>
          ))}
        </div>
      </div>

      <div className="post-spin__section">
        <button
          className="post-spin__action-btn post-spin__action-btn--again"
          onClick={onSpinAgain}
        >
          Spin Again
        </button>
      </div>
    </div>
  );
}
