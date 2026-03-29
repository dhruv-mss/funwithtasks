import TaskItem from './TaskItem';

export default function TaskList({ tasks, dispatch, activeTaskId }) {
  if (tasks.length === 0) {
    return (
      <div className="task-list__empty">
        <span>No tasks yet.</span>
        <span>Add one above to get started!</span>
      </div>
    );
  }

  // Sort: High first, then Med, then Low; within same priority by createdAt
  const order = { High: 0, Med: 1, Low: 2 };
  const sorted = [...tasks].sort(
    (a, b) => order[a.priority] - order[b.priority] || a.createdAt - b.createdAt
  );

  return (
    <div className="task-list">
      {sorted.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          dispatch={dispatch}
          isActive={task.id === activeTaskId}
        />
      ))}
    </div>
  );
}
