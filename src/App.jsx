import { useReducer, useState, useEffect } from 'react';
import { taskReducer, initialState } from './utils/taskReducer';
import { useLocalStorage } from './hooks/useLocalStorage';
import Sidebar from './components/Sidebar/Sidebar';
import SpinnerWheel from './components/SpinnerWheel/SpinnerWheel';
import PostSpinPanel from './components/PostSpinPanel/PostSpinPanel';
import CountdownTimer from './components/CountdownTimer/CountdownTimer';
import './App.css';

const STORAGE_KEY = 'funwithtasks_v2';

export default function App() {
  const [persistedState, setPersistedState] = useLocalStorage(STORAGE_KEY, initialState);

  const [state, dispatch] = useReducer(taskReducer, {
    ...initialState,
    ...persistedState,
  });

  const [spinResult, setSpinResult] = useState(null);   // Task | null
  const [timerConfig, setTimerConfig] = useState(null); // { taskId, taskName, taskPriority, seconds } | null

  // Sync full state to localStorage
  useEffect(() => {
    setPersistedState(state);
  }, [state]);

  // If the spinResult task was completed/removed externally, clear it
  useEffect(() => {
    if (spinResult && !state.tasks.find((t) => t.id === spinResult.id)) {
      setSpinResult(null);
    }
  }, [state.tasks, spinResult]);

  // If the timer task was completed/removed externally, cancel timer
  useEffect(() => {
    if (timerConfig && !state.tasks.find((t) => t.id === timerConfig.taskId)) {
      setTimerConfig(null);
    }
  }, [state.tasks, timerConfig]);

  function handleSpinComplete(task) {
    setSpinResult(task);
  }

  function handleSpinAgain() {
    setSpinResult(null);
  }

  function handleStartTimer(taskId, seconds) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    setTimerConfig({
      taskId,
      taskName: task.name,
      taskPriority: task.priority,
      seconds,
    });
    setSpinResult(null);
  }

  function handleTimerEnd() {
    setTimerConfig(null);
  }

  const activeTaskId = timerConfig?.taskId ?? spinResult?.id ?? null;

  const rightPanel = timerConfig ? (
    <CountdownTimer
      key={timerConfig.taskId + timerConfig.seconds}
      taskId={timerConfig.taskId}
      taskName={timerConfig.taskName}
      taskPriority={timerConfig.taskPriority}
      initialSeconds={timerConfig.seconds}
      dispatch={dispatch}
      onEnd={handleTimerEnd}
    />
  ) : spinResult ? (
    <PostSpinPanel
      task={spinResult}
      onSpinAgain={handleSpinAgain}
      onStartTimer={handleStartTimer}
    />
  ) : (
    <div className="app__right-idle">
      <div className="app__right-idle-icon">🎯</div>
      <p>Spin the wheel to pick your next task</p>
    </div>
  );

  return (
    <div className="app">
      <Sidebar
        tasks={state.tasks}
        dispatch={dispatch}
        activeTaskId={activeTaskId}
        completedToday={state.completedToday}
      />
      <main className="app__center">
        <SpinnerWheel
          tasks={state.tasks}
          onSpinComplete={handleSpinComplete}
          activeTaskId={activeTaskId}
        />
      </main>
      <aside className="app__right">{rightPanel}</aside>
    </div>
  );
}
