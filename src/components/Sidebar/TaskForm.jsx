import { useState } from 'react';
import './TaskForm.css';

export default function TaskForm({ dispatch }) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('High');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({ type: 'ADD_TASK', payload: { name, priority } });
    setName('');
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        className="task-form__input"
        type="text"
        placeholder="Task name…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
      />
      <div className="task-form__row">
        <select
          className="task-form__select"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="High">High</option>
          <option value="Med">Med</option>
          <option value="Low">Low</option>
        </select>
        <button
          className="task-form__btn"
          type="submit"
          disabled={!name.trim()}
        >
          + Add
        </button>
      </div>
    </form>
  );
}
