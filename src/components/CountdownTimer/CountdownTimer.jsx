import { useRef, useEffect } from 'react';
import { useTimer, formatCountdown } from '../../hooks/useTimer';
import { playAlarm, playFiveMinuteWarning } from '../../utils/alarm';
import { PRIORITY_COLORS } from '../../utils/taskReducer';
import './CountdownTimer.css';

export default function CountdownTimer({
  taskId,
  taskName,
  taskPriority,
  initialSeconds,
  dispatch,
  onEnd,
}) {
  const alarmFiredRef = useRef(false);
  const warningFiredRef = useRef(false);

  // Internal elapsed time tracking (accurate across pauses)
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef(Date.now());

  const { secondsLeft, paused, pause, resume } = useTimer(initialSeconds, handleEnd);

  // Pause / resume segment tracking
  function handlePause() {
    accumulatedMsRef.current += Date.now() - segmentStartRef.current;
    segmentStartRef.current = null;
    pause();
  }

  function handleResume() {
    segmentStartRef.current = Date.now();
    resume();
  }

  function getElapsed() {
    return (
      accumulatedMsRef.current +
      (segmentStartRef.current ? Date.now() - segmentStartRef.current : 0)
    );
  }

  // 5-minute warning
  useEffect(() => {
    if (secondsLeft <= 300 && secondsLeft > 295 && !warningFiredRef.current && !paused) {
      warningFiredRef.current = true;
      playFiveMinuteWarning();
    }
  }, [secondsLeft, paused]);

  function handleEnd() {
    if (!alarmFiredRef.current) {
      alarmFiredRef.current = true;
      playAlarm();
    }
    dispatch({ type: 'ADD_TIME', payload: { id: taskId, ms: getElapsed() } });
    onEnd();
  }

  function handleCancel() {
    dispatch({ type: 'ADD_TIME', payload: { id: taskId, ms: getElapsed() } });
    onEnd();
  }

  const pct = Math.round((secondsLeft / initialSeconds) * 100);
  const isLow = pct <= 25;
  const warningSoon = secondsLeft <= 300 && secondsLeft > 0 && initialSeconds > 300;

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

      <div
        className={`countdown__display ${isLow ? 'countdown__display--low' : ''} ${
          paused ? 'countdown__display--paused' : ''
        }`}
      >
        {formatCountdown(secondsLeft)}
      </div>

      {paused && <div className="countdown__paused-label">Paused</div>}

      {warningSoon && !paused && (
        <div className="countdown__warning-badge">5 min warning fired</div>
      )}

      <div className="countdown__bar-wrap">
        <div
          className={`countdown__bar ${isLow ? 'countdown__bar--low' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="countdown__pct">{pct}% remaining</div>

      <div className="countdown__controls">
        <button
          className={`countdown__pause-btn ${paused ? 'countdown__pause-btn--resume' : ''}`}
          onClick={paused ? handleResume : handlePause}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="countdown__cancel" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
