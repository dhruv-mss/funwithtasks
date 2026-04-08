import { useState, useEffect } from 'react';
import SpinnerWheel from '../SpinnerWheel/SpinnerWheel';
import PostSpinPanel from '../PostSpinPanel/PostSpinPanel';
import CountdownTimer from '../CountdownTimer/CountdownTimer';
import GoalResultModal from '../GoalResultModal/GoalResultModal';
import FollowUpModal from '../FollowUpModal/FollowUpModal';
import { getUncategorized, PRIORITY_WEIGHTS } from '../../utils/rpmReducer';
import './SpinModal.css';

export default function SpinModal({ state, dispatch, onClose }) {
  const [spinResult, setSpinResult] = useState(null);
  const [timerConfig, setTimerConfig] = useState(null);

  // Build spin items from uncategorized tasks + goals with tasks + follow-up
  const uncategorized = getUncategorized(state);
  const goalItems = state.goals
    .filter((g) => g.taskIds.length > 0)
    .map((g) => ({ id: g.id, name: g.title, type: 'goal', weight: 3 }));
  const hasDelegated = state.people.some((p) => p.taskIds.length > 0);
  const followupItem = hasDelegated
    ? [{ id: 'followup', name: 'Follow-up', type: 'followup', weight: 2 }]
    : [];
  const taskItems = uncategorized.map((t) => ({
    id: t.id,
    name: t.name,
    type: 'task',
    weight: PRIORITY_WEIGHTS[t.priority],
  }));
  const spinItems = [...taskItems, ...goalItems, ...followupItem];

  // Clear spin result if the item disappears
  useEffect(() => {
    if (!spinResult) return;
    if (spinResult.type === 'task' && !state.tasks.find((t) => t.id === spinResult.id)) {
      setSpinResult(null);
    }
    if (spinResult.type === 'goal' && !state.goals.find((g) => g.id === spinResult.id)) {
      setSpinResult(null);
    }
  }, [state.tasks, state.goals, spinResult]);

  // Clear timer config if task disappears
  useEffect(() => {
    if (timerConfig && !state.tasks.find((t) => t.id === timerConfig.taskId)) {
      setTimerConfig(null);
    }
  }, [state.tasks, timerConfig]);

  function handleSpinComplete(item) {
    setSpinResult(item);
    setTimerConfig(null);
  }

  function handleSpinAgain() {
    setSpinResult(null);
    setTimerConfig(null);
  }

  function handleStartTimer(taskId, seconds) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    setTimerConfig({ taskId, taskName: task.name, taskPriority: task.priority, seconds });
    setSpinResult(null);
  }

  function handleTimerEnd() {
    setTimerConfig(null);
  }

  // Determine which right panel to show
  let resultPanel = null;
  if (timerConfig) {
    resultPanel = (
      <CountdownTimer
        key={timerConfig.taskId + timerConfig.seconds}
        taskId={timerConfig.taskId}
        taskName={timerConfig.taskName}
        taskPriority={timerConfig.taskPriority}
        initialSeconds={timerConfig.seconds}
        dispatch={dispatch}
        onEnd={handleTimerEnd}
      />
    );
  } else if (spinResult?.type === 'goal') {
    const goal = state.goals.find((g) => g.id === spinResult.id);
    if (goal) {
      resultPanel = (
        <GoalResultModal
          goal={goal}
          tasks={state.tasks}
          onSpinAgain={handleSpinAgain}
          onStartTimer={handleStartTimer}
        />
      );
    }
  } else if (spinResult?.type === 'followup') {
    resultPanel = (
      <FollowUpModal
        people={state.people}
        tasks={state.tasks}
        dispatch={dispatch}
        onSpinAgain={handleSpinAgain}
      />
    );
  } else if (spinResult?.type === 'task') {
    const task = state.tasks.find((t) => t.id === spinResult.id);
    if (task) {
      resultPanel = (
        <PostSpinPanel
          task={task}
          onSpinAgain={handleSpinAgain}
          onStartTimer={handleStartTimer}
        />
      );
    }
  }

  return (
    <div className="spin-modal__backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="spin-modal">
        <div className="spin-modal__header">
          <span className="spin-modal__title">Spin Tasks</span>
          <span className="spin-modal__sub">{spinItems.length} items in play</span>
          <button className="spin-modal__close" onClick={onClose}>×</button>
        </div>

        <div className="spin-modal__body">
          <div className="spin-modal__wheel-col">
            <SpinnerWheel spinItems={spinItems} onSpinComplete={handleSpinComplete} />
          </div>

          {resultPanel && (
            <div className="spin-modal__result-col">
              {resultPanel}
            </div>
          )}

          {!resultPanel && (
            <div className="spin-modal__idle">
              <div className="spin-modal__idle-icon">🎯</div>
              <p>Spin the wheel to pick what to work on next</p>
              <div className="spin-modal__breakdown">
                {taskItems.length > 0 && <span>{taskItems.length} tasks</span>}
                {goalItems.length > 0 && <span>{goalItems.length} goals</span>}
                {hasDelegated && <span>1 follow-up</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
