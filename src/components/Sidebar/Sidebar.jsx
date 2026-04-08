import TaskForm from './TaskForm';
import TaskList from './TaskList';
import './Sidebar.css';

const MESSAGES = [
  'First one down. Let\'s keep the momentum!',
  'Two done. You\'re building a streak!',
  'Three tasks cleared. You\'re on a roll!',
  'Four down. Deep focus is your superpower.',
  'Five tasks! You\'re absolutely crushing it.',
  'Six done. The best version of you showed up today.',
  'Seven tasks cleared. Legendary work ethic.',
  'Eight down. You\'re in the zone — stay there!',
  'Nine tasks! You make it look effortless.',
  'Ten tasks completed. Hall of fame performance.',
  'Eleven done. Future you is very grateful.',
  'Twelve tasks! Nothing can stop you today.',
  'Thirteen cleared. You turned "impossible" into done.',
  'Fourteen tasks. You\'re writing a great story today.',
  'Fifteen done. Pure relentless execution — respect.',
];

export default function Sidebar({ tasks, dispatch, completedToday, activeTaskId }) {
  const totalTime = tasks.reduce((sum, t) => sum + t.timeSpent, 0);
  const count = completedToday?.count ?? 0;
  const message = count > 0 ? MESSAGES[(count - 1) % MESSAGES.length] : '';

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2 className="sidebar__title">Tasks</h2>
        {tasks.length > 0 && (
          <span className="sidebar__count">{tasks.length}</span>
        )}
      </div>

      {count > 0 && (
        <div className="sidebar__today">
          <span className="sidebar__today-count">✓ {count} done today</span>
          <span className="sidebar__today-msg">{message}</span>
        </div>
      )}

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
