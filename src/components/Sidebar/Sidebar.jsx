import TaskForm from './TaskForm';
import TaskList from './TaskList';
import './Sidebar.css';

export default function Sidebar({ tasks, dispatch, activeTaskId }) {
  const totalTime = tasks.reduce((sum, t) => sum + t.timeSpent, 0);

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2 className="sidebar__title">Tasks</h2>
        {tasks.length > 0 && (
          <span className="sidebar__count">{tasks.length}</span>
        )}
      </div>
      <TaskForm dispatch={dispatch} />
      <div className="sidebar__list-wrapper">
        <TaskList tasks={tasks} dispatch={dispatch} activeTaskId={activeTaskId} />
      </div>
      {totalTime > 0 && (
        <div className="sidebar__footer">
          Session total: {Math.round(totalTime / 60000)}m
        </div>
      )}
    </aside>
  );
}
