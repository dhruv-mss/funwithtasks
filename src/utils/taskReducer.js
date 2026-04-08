export const PRIORITY_WEIGHTS = { High: 3, Med: 2, Low: 1 };

export const PRIORITY_COLORS = {
  High: '#ef4444',
  Med: '#f59e0b',
  Low: '#22c55e',
};

export const initialState = {
  tasks: [],
  completedToday: { count: 0, date: '' },
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function taskReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: crypto.randomUUID(),
            name: action.payload.name.trim(),
            priority: action.payload.priority,
            timeSpent: 0,
            createdAt: Date.now(),
          },
        ],
      };

    case 'COMPLETE_TASK': {
      const today = todayStr();
      const prevCount =
        state.completedToday.date === today ? state.completedToday.count : 0;
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload.id),
        completedToday: { count: prevCount + 1, date: today },
      };
    }

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload.id),
      };

    case 'ADD_TIME':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? { ...t, timeSpent: t.timeSpent + action.payload.ms }
            : t
        ),
      };

    default:
      return state;
  }
}
