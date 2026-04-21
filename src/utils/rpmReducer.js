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
  logs: [],
  dashboard: {
    date: '',
    objective: '',
    sections: {
      eatFrog: null,      // single taskId
      product: [],        // array of taskIds
      marketing: [],
      personal: [],
      hobbies: [],
      rpmProject: [],
    },
    reviewToday: [],      // delegated task IDs to review today
    meetings: [],
    teamFocus: {},
    routines: { read: false, delegate: false, review: false, kriya: false },
  },
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

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

// Remove a task from all dashboard sections, review list, and team focus
function cleanDashboardTask(state, taskId) {
  const db = state.dashboard || {};
  const sections = db.sections || {};
  const teamFocus = db.teamFocus || {};
  return {
    ...state,
    dashboard: {
      ...db,
      sections: Object.fromEntries(
        Object.entries(sections).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.filter((id) => id !== taskId) : (v === taskId ? null : v),
        ])
      ),
      reviewToday: (db.reviewToday || []).filter((id) => id !== taskId),
      teamFocus: Object.fromEntries(
        Object.entries(teamFocus).map(([pid, val]) => [
          pid,
          Array.isArray(val) ? val.filter((id) => id !== taskId) : (val === taskId ? [] : val),
        ])
      ),
    },
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
      const withDash = cleanDashboardTask(cleaned, action.payload.id);
      return {
        ...withDash,
        tasks: withDash.tasks.filter((t) => t.id !== action.payload.id),
        completedToday: { count: prevCount + 1, date: today },
      };
    }

    case 'DELETE_TASK': {
      const cleaned = removeTaskFromBuckets(state, action.payload.id);
      const withDash = cleanDashboardTask(cleaned, action.payload.id);
      return {
        ...withDash,
        tasks: withDash.tasks.filter((t) => t.id !== action.payload.id),
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

    // ── Decision Logs ──────────────────────────────────────────────
    case 'ADD_LOG':
      return {
        ...state,
        logs: [
          {
            id: crypto.randomUUID(),
            type: action.payload.type,
            content: action.payload.content.trim(),
            createdAt: Date.now(),
            replies: [],
          },
          ...state.logs,
        ],
      };

    case 'DELETE_LOG':
      return {
        ...state,
        logs: state.logs.filter((l) => l.id !== action.payload.id),
      };

    case 'ADD_LOG_REPLY':
      return {
        ...state,
        logs: state.logs.map((l) =>
          l.id === action.payload.logId
            ? {
                ...l,
                replies: [
                  ...(l.replies || []),
                  {
                    id: crypto.randomUUID(),
                    content: action.payload.content.trim(),
                    createdAt: Date.now(),
                  },
                ],
              }
            : l
        ),
      };

    case 'DELETE_LOG_REPLY':
      return {
        ...state,
        logs: state.logs.map((l) =>
          l.id === action.payload.logId
            ? { ...l, replies: (l.replies || []).filter((r) => r.id !== action.payload.replyId) }
            : l
        ),
      };

    // ── Dashboard ──────────────────────────────────────────────────
    case 'SET_DASHBOARD_DATE':
      return {
        ...state,
        dashboard: {
          ...(state.dashboard || {}),
          date: action.payload.date,
          routines: { read: false, delegate: false, review: false, kriya: false },
          reviewToday: [],
          meetings: [],
        },
      };

    case 'SET_DASHBOARD_OBJECTIVE':
      return {
        ...state,
        dashboard: { ...(state.dashboard || {}), objective: action.payload.objective },
      };

    case 'SET_SECTION_TASK':
      return {
        ...state,
        dashboard: {
          ...(state.dashboard || {}),
          sections: {
            ...((state.dashboard || {}).sections || {}),
            [action.payload.section]: action.payload.taskId,
          },
        },
      };

    case 'ADD_SECTION_TASK': {
      const db = state.dashboard || {};
      const current = Array.isArray(db.sections?.[action.payload.section])
        ? db.sections[action.payload.section]
        : [];
      if (current.includes(action.payload.taskId)) return state;
      return {
        ...state,
        dashboard: {
          ...db,
          sections: { ...(db.sections || {}), [action.payload.section]: [...current, action.payload.taskId] },
        },
      };
    }

    case 'REMOVE_SECTION_TASK': {
      const db = state.dashboard || {};
      const current = Array.isArray(db.sections?.[action.payload.section])
        ? db.sections[action.payload.section]
        : [];
      return {
        ...state,
        dashboard: {
          ...db,
          sections: {
            ...(db.sections || {}),
            [action.payload.section]: current.filter((id) => id !== action.payload.taskId),
          },
        },
      };
    }

    case 'ADD_REVIEW_TASK': {
      const db = state.dashboard || {};
      const current = db.reviewToday || [];
      if (current.includes(action.payload.taskId)) return state;
      return {
        ...state,
        dashboard: { ...db, reviewToday: [...current, action.payload.taskId] },
      };
    }

    case 'REMOVE_REVIEW_TASK': {
      const db = state.dashboard || {};
      return {
        ...state,
        dashboard: {
          ...db,
          reviewToday: (db.reviewToday || []).filter((id) => id !== action.payload.taskId),
        },
      };
    }

    case 'ADD_MEETING':
      return {
        ...state,
        dashboard: {
          ...(state.dashboard || {}),
          meetings: [
            ...((state.dashboard || {}).meetings || []),
            { id: crypto.randomUUID(), title: action.payload.title, time: action.payload.time },
          ],
        },
      };

    case 'DELETE_MEETING':
      return {
        ...state,
        dashboard: {
          ...(state.dashboard || {}),
          meetings: ((state.dashboard || {}).meetings || []).filter(
            (m) => m.id !== action.payload.id
          ),
        },
      };

    case 'ADD_TEAM_FOCUS_TASK': {
      const db = state.dashboard || {};
      const current = Array.isArray(db.teamFocus?.[action.payload.personId])
        ? db.teamFocus[action.payload.personId]
        : [];
      if (current.includes(action.payload.taskId)) return state;
      return {
        ...state,
        dashboard: {
          ...db,
          teamFocus: { ...(db.teamFocus || {}), [action.payload.personId]: [...current, action.payload.taskId] },
        },
      };
    }

    case 'REMOVE_TEAM_FOCUS_TASK': {
      const db = state.dashboard || {};
      const current = Array.isArray(db.teamFocus?.[action.payload.personId])
        ? db.teamFocus[action.payload.personId]
        : [];
      return {
        ...state,
        dashboard: {
          ...db,
          teamFocus: {
            ...(db.teamFocus || {}),
            [action.payload.personId]: current.filter((id) => id !== action.payload.taskId),
          },
        },
      };
    }

    case 'TOGGLE_ROUTINE':
      return {
        ...state,
        dashboard: {
          ...(state.dashboard || {}),
          routines: {
            ...((state.dashboard || {}).routines || {}),
            [action.payload.routineId]: !((state.dashboard || {}).routines || {})[action.payload.routineId],
          },
        },
      };

    default:
      return state;
  }
}
