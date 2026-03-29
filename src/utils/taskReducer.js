export const PRIORITY_WEIGHTS = { High: 3, Med: 2, Low: 1 };

export const PRIORITY_COLORS = {
  High: '#ef4444',
  Med: '#f59e0b',
  Low: '#22c55e',
};

const initialState = { tasks: [] };

export function taskReducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { ...state, tasks: action.payload };

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: crypto.randomUUID(),
            name: action.payload.name.trim(),
            priority: action.payload.priority,
            blocked: false,
            timeSpent: 0,
            createdAt: Date.now(),
          },
        ],
      };

    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload.id),
      };

    case 'BLOCK_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? { ...t, blocked: !t.blocked } : t
        ),
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

export { initialState };
