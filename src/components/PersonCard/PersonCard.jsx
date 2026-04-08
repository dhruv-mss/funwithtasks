import { useDroppable } from '@dnd-kit/core';
import TaskChip from '../TaskChip/TaskChip';
import './PersonCard.css';

export default function PersonCard({ person, tasks, dispatch }) {
  const { setNodeRef, isOver } = useDroppable({ id: `person-${person.id}` });

  const personTasks = person.taskIds
    .map((id) => tasks.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <div className={`person-card ${isOver ? 'person-card--over' : ''}`}>
      <div className="person-card__header">
        <span className="person-card__avatar">
          {person.name.charAt(0).toUpperCase()}
        </span>
        <span className="person-card__name">{person.name}</span>
        <button
          className="person-card__delete"
          onClick={() => dispatch({ type: 'DELETE_PERSON', payload: { id: person.id } })}
          title="Remove person"
        >
          ×
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`person-card__tasks ${isOver ? 'person-card__tasks--over' : ''}`}
      >
        {personTasks.length === 0 && (
          <div className="person-card__hint">
            {isOver ? 'Drop to delegate' : 'Drag tasks here'}
          </div>
        )}
        {personTasks.map((task) => (
          <TaskChip
            key={task.id}
            task={task}
            dispatch={dispatch}
            compact
            onComplete={() =>
              dispatch({ type: 'COMPLETE_TASK', payload: { id: task.id } })
            }
            onUnassign={() =>
              dispatch({ type: 'UNASSIGN_TASK', payload: { taskId: task.id } })
            }
          />
        ))}
      </div>
    </div>
  );
}
