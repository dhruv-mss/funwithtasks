import { PRIORITY_COLORS } from '../../utils/rpmReducer';
import './GoalResultModal.css';

function TimerRow({ task, onStartTimer }) {
  return (
    <div className="goal-result__task-row">
      <span
        className="goal-result__dot"
        style={{ background: PRIORITY_COLORS[task.priority] }}
      />
      <span className="goal-result__task-name" title={task.name}>{task.name}</span>
      <div className="goal-result__timer-btns">
        {[15, 30, 60].map((min) => (
          <button
            key={min}
            className="goal-result__timer-btn"
            onClick={() => onStartTimer(task.id, min * 60)}
          >
            {min}m
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GoalResultModal({ goal, tasks, onSpinAgain, onStartTimer }) {
  const goalTasks = goal.taskIds
    .map((id) => tasks.find((t) => t.id === id))
    .filter(Boolean);
  const massTask = goalTasks.find((t) => t.id === goal.massActionTaskId);
  const otherTasks = goalTasks.filter((t) => t.id !== goal.massActionTaskId);

  return (
    <div className="goal-result">
      <div className="goal-result__tag">Goal Selected</div>
      <h3 className="goal-result__title">{goal.title}</h3>

      {(goal.what || goal.why) && (
        <div className="goal-result__context">
          {goal.what && <p className="goal-result__what">"{goal.what}"</p>}
          {goal.why && <p className="goal-result__why">→ {goal.why}</p>}
        </div>
      )}

      {massTask && (
        <div className="goal-result__mass">
          <div className="goal-result__mass-label">⭐ #1 Action</div>
          <TimerRow task={massTask} onStartTimer={onStartTimer} />
        </div>
      )}

      {otherTasks.length > 0 && (
        <div className="goal-result__others">
          <div className="goal-result__others-label">Other tasks</div>
          {otherTasks.map((task) => (
            <TimerRow key={task.id} task={task} onStartTimer={onStartTimer} />
          ))}
        </div>
      )}

      {goalTasks.length === 0 && (
        <p className="goal-result__empty">No tasks in this goal yet.</p>
      )}

      <button className="goal-result__spin-again" onClick={onSpinAgain}>
        Spin Again
      </button>
    </div>
  );
}
