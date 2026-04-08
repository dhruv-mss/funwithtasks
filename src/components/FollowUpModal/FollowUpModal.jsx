import { PRIORITY_COLORS } from '../../utils/rpmReducer';
import './FollowUpModal.css';

export default function FollowUpModal({ people, tasks, dispatch, onSpinAgain }) {
  const delegated = people
    .map((p) => ({
      ...p,
      tasks: p.taskIds.map((id) => tasks.find((t) => t.id === id)).filter(Boolean),
    }))
    .filter((p) => p.tasks.length > 0);

  return (
    <div className="followup">
      <div className="followup__tag">Follow-up</div>
      <h3 className="followup__title">Delegated Tasks</h3>
      <p className="followup__sub">Check in with your team on these items.</p>

      <div className="followup__list">
        {delegated.map((person) => (
          <div key={person.id} className="followup__person">
            <div className="followup__person-header">
              <span className="followup__avatar">
                {person.name.charAt(0).toUpperCase()}
              </span>
              <span className="followup__name">{person.name}</span>
              <span className="followup__count">{person.tasks.length}</span>
            </div>
            {person.tasks.map((task) => (
              <div key={task.id} className="followup__task">
                <span
                  className="followup__dot"
                  style={{ background: PRIORITY_COLORS[task.priority] }}
                />
                <span className="followup__task-name">{task.name}</span>
                <button
                  className="followup__done-btn"
                  onClick={() =>
                    dispatch({ type: 'COMPLETE_TASK', payload: { id: task.id } })
                  }
                  title="Mark done"
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <button className="followup__spin-again" onClick={onSpinAgain}>
        Spin Again
      </button>
    </div>
  );
}
