import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PRIORITY_COLORS } from '../../utils/rpmReducer';
import { formatTimeSpent } from '../../hooks/useTimer';
import './TaskChip.css';

export default function TaskChip({
  task,
  dispatch,
  isMassAction = false,
  onComplete,
  onDelete,
  onUnassign,
  compact = false,
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { taskId: task.id } });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-chip ${isMassAction ? 'task-chip--star' : ''} ${
        isDragging ? 'task-chip--dragging' : ''
      } ${compact ? 'task-chip--compact' : ''}`}
      {...listeners}
      {...attributes}
    >
      <span
        className="task-chip__dot"
        style={{ background: PRIORITY_COLORS[task.priority] }}
      />
      <span className="task-chip__name" title={task.name}>
        {isMassAction && <span className="task-chip__star">⭐</span>}
        {task.name}
      </span>
      {!compact && task.timeSpent > 0 && (
        <span className="task-chip__time">{formatTimeSpent(task.timeSpent)}</span>
      )}
      <div className="task-chip__actions" onPointerDown={(e) => e.stopPropagation()}>
        {onComplete && (
          <button
            className="task-chip__btn task-chip__btn--done"
            onClick={onComplete}
            title="Mark complete"
          >
            ✓
          </button>
        )}
        {onUnassign && (
          <button
            className="task-chip__btn task-chip__btn--unassign"
            onClick={onUnassign}
            title="Return to pool"
          >
            ↩
          </button>
        )}
        {onDelete && (
          <button
            className="task-chip__btn task-chip__btn--del"
            onClick={onDelete}
            title="Delete"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
