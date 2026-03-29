import { useRef } from 'react';
import { useTimer, formatCountdown } from '../../hooks/useTimer';
import { playAlarm } from '../../utils/alarm';
import { PRIORITY_COLORS } from '../../utils/taskReducer';
import './CountdownTimer.css';

export default function CountdownTimer({
  taskId,
  taskName,
  taskPriority,
  initialSeconds,
  startTime,
  dispatch,
  onEnd,
}) {
  const alarmFired = useRef(false);

  function handleEnd() {
    if (!alarmFired.current) {
      alarmFired.current = true;
      playAlarm();
    }
    const elapsed = Date.now() - startTime;
    dispatch({ type: 'ADD_TIME', payload: { id: taskId, ms: elapsed } });
    onEnd();
  }

  const { secondsLeft } = useTimer(initialSeconds, handleEnd);

  const pct = Math.round((secondsLeft / initialSeconds) * 100);
  const isLow = pct <= 25;

  function handleCancel() {
    const elapsed = Date.now() - startTime;
    dispatch({ type: 'ADD_TIME', payload: { id: taskId, ms: elapsed } });
    onEnd();
  }

  return (
    <div className="countdown">
      <div className="countdown__task-info">
        <span className="countdown__working">Working on</span>
        <div className="countdown__task-name">{taskName}</div>
        <span
          className="countdown__priority"
          style={{ background: PRIORITY_COLORS[taskPriority] }}
        >
          {taskPriority}
        </span>
      </div>

      <div className={`countdown__display ${isLow ? 'countdown__display--low' : ''}`}>
        {formatCountdown(secondsLeft)}
      </div>

      <div className="countdown__bar-wrap">
        <div
          className={`countdown__bar ${isLow ? 'countdown__bar--low' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="countdown__pct">{pct}% remaining</div>

      <button className="countdown__cancel" onClick={handleCancel}>
        Cancel & save time
      </button>
    </div>
  );
}
