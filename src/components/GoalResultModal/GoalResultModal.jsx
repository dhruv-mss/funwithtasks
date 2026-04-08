import { PRIORITY_COLORS } from '../../utils/rpmReducer';
import './GoalResultModal.css';

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
          <div className="goal-result__mass-task">
            <span
              className="goal-result__dot"
              style={{ background: PRIORITY_COLORS[massTask.priority] }}
            />
            {massTask.name}
          </div>
          <div className="goal-result__timer-btns">
            {[15, 30, 60].map((min) => (
              <button
                key={min}
                className="goal-result__timer-btn"
                onClick={() => onStartTimer(massTask.id, min * 60)}
              >
                {min}m
              </button>
            ))}
          </div>
        </div>
      )}

      {otherTasks.length > 0 && (
        <div className="goal-result__others">
          <div className="goal-result__others-label">Other tasks in this goal</div>
          {otherTasks.map((task) => (
            <div key={task.id} className="goal-result__other-task">
              <span
                className="goal-result__dot"
                style={{ background: PRIORITY_COLORS[task.priority] }}
              />
              <span>{task.name}</span>
            </div>
          ))}
        </div>
      )}

      <button className="goal-result__spin-again" onClick={onSpinAgain}>
        Spin Again
      </button>
    </div>
  );
}
