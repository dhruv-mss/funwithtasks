export const PRIORITY_WEIGHTS = { High: 3, Med: 2, Low: 1 };

export const PRIORITY_COLORS = {
  High: '#ef4444',
  Med: '#f59e0b',
  Low: '#22c55e',
};

export const initialState = {
  tasks: [],
  goals: [],
  people: [],
  completedToday: { count: 0, date: '' },
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Returns task IDs that are in any goal or person section
function categorizedIds(state) {
  return new Set([
    ...state.goals.flatMap((g) => g.taskIds),
    ...state.people.flatMap((p) => p.taskIds),
  ]);
}

export function getUncategorized(state) {
  const cat = categorizedIds(state);
  return state.tasks.filter((t) => !cat.has(t.id));
}

// Remove a taskId from all goals and people lists
function removeTaskFromBuckets(state, taskId) {
  return {
    ...state,
    goals: state.goals.map((g) => ({
      ...g,
      taskIds: g.taskIds.filter((id) => id !== taskId),
      massActionTaskId: g.massActionTaskId === taskId ? null : g.massActionTaskId,
    })),
    people: state.people.map((p) => ({
      ...p,
      taskIds: p.taskIds.filter((id) => id !== taskId),
    })),
  };
}

export function rpmReducer(state, action) {
  switch (action.type) {
    // ── Tasks ──────────────────────────────────────────────────────
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
      const cleaned = removeTaskFromBuckets(state, action.payload.id);
      return {
        ...cleaned,
        tasks: cleaned.tasks.filter((t) => t.id !== action.payload.id),
        completedToday: { count: prevCount + 1, date: today },
      };
    }

    case 'DELETE_TASK': {
      const cleaned = removeTaskFromBuckets(state, action.payload.id);
      return {
        ...cleaned,
        tasks: cleaned.tasks.filter((t) => t.id !== action.payload.id),
      };
    }

    case 'ADD_TIME':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? { ...t, timeSpent: t.timeSpent + action.payload.ms }
            : t
        ),
      };

    // ── Goals ──────────────────────────────────────────────────────
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [
          ...state.goals,
          {
            id: crypto.randomUUID(),
            title: action.payload.title || 'New Goal',
            what: '',
            why: '',
            taskIds: [],
            massActionTaskId: null,
            createdAt: Date.now(),
          },
        ],
      };

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? { ...g, ...action.payload.patch } : g
        ),
      };

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload.id),
      };

    // ── People ─────────────────────────────────────────────────────
    case 'ADD_PERSON':
      return {
        ...state,
        people: [
          ...state.people,
          {
            id: crypto.randomUUID(),
            name: action.payload.name.trim(),
            taskIds: [],
            createdAt: Date.now(),
          },
        ],
      };

    case 'DELETE_PERSON':
      return {
        ...state,
        people: state.people.filter((p) => p.id !== action.payload.id),
      };

    // ── Drag & Drop ────────────────────────────────────────────────
    case 'ASSIGN_TASK': {
      // Remove from all buckets first, then add to destination
      const cleaned = removeTaskFromBuckets(state, action.payload.taskId);
      const { dest } = action.payload;
      if (dest.type === 'goal') {
        return {
          ...cleaned,
          goals: cleaned.goals.map((g) =>
            g.id === dest.id
              ? { ...g, taskIds: [...g.taskIds, action.payload.taskId] }
              : g
          ),
        };
      }
      if (dest.type === 'person') {
        return {
          ...cleaned,
          people: cleaned.people.map((p) =>
            p.id === dest.id
              ? { ...p, taskIds: [...p.taskIds, action.payload.taskId] }
              : p
          ),
        };
      }
      return cleaned;
    }

    case 'UNASSIGN_TASK':
      return removeTaskFromBuckets(state, action.payload.taskId);

    // Composite: add a new task directly into a goal (used by GoalCard mass-action picker)
    case '_ASSIGN_NEW': {
      const newId = crypto.randomUUID();
      const withTask = {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: newId,
            name: action.payload.name.trim(),
            priority: action.payload.priority,
            timeSpent: 0,
            createdAt: Date.now(),
          },
        ],
      };
      return {
        ...withTask,
        goals: withTask.goals.map((g) =>
          g.id === action.payload.goalId
            ? { ...g, taskIds: [...g.taskIds, newId], massActionTaskId: g.massActionTaskId ?? newId }
            : g
        ),
      };
    }

    default:
      return state;
  }
}
