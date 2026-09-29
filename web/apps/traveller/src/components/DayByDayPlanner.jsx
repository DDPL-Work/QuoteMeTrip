import { useState } from 'react';

const EMPTY_DAY = {
  dayNumber: 1,
  date: '',
  location: '',
  title: '',
  description: '',
  hotelNotes: '',
  guideNotes: '',
  driverNotes: '',
  specialRequirements: '',
};

export function DayByDayPlanner({ days = [], onAdd, onUpdate, onDelete }) {
  const [form, setForm] = useState(EMPTY_DAY);
  const [editingId, setEditingId] = useState(null);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const payload = { ...form, dayNumber: Number(form.dayNumber) };
    if (editingId) {
      onUpdate(editingId, payload);
      setEditingId(null);
    } else {
      onAdd(payload);
    }
    setForm(EMPTY_DAY);
  }

  function startEdit(day) {
    setEditingId(day.id);
    setForm({ ...EMPTY_DAY, ...day });
  }

  return (
    <section aria-label="Day by day planner">
      <h3>Day-by-day planner</h3>
      {days.length === 0 ? (
        <p>No days yet.</p>
      ) : (
        <ol>
          {days.map((day) => (
            <li key={day.id ?? day.dayNumber}>
              <span>
                Day {day.dayNumber}: {day.title || day.location || 'Untitled'}
              </span>
              <button type="button" onClick={() => startEdit(day)}>
                Edit
              </button>
              <button type="button" onClick={() => onDelete(day.id)}>
                Delete
              </button>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={submit} aria-label={editingId ? 'Edit day' : 'Add day'}>
        <label>
          {' '}
          Day number{' '}
          <input
            type="number"
            value={form.dayNumber}
            onChange={(e) => set('dayNumber', e.target.value)}
          />{' '}
        </label>
        <label>
          {' '}
          Date{' '}
          <input
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            placeholder="YYYY-MM-DD"
          />{' '}
        </label>
        <label>
          {' '}
          Location{' '}
          <input value={form.location} onChange={(e) => set('location', e.target.value)} />{' '}
        </label>
        <label>
          {' '}
          Title <input value={form.title} onChange={(e) => set('title', e.target.value)} />{' '}
        </label>
        <label>
          {' '}
          Description{' '}
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />{' '}
        </label>
        <label>
          {' '}
          Hotel notes{' '}
          <input value={form.hotelNotes} onChange={(e) => set('hotelNotes', e.target.value)} />{' '}
        </label>
        <label>
          {' '}
          Guide notes{' '}
          <input value={form.guideNotes} onChange={(e) => set('guideNotes', e.target.value)} />{' '}
        </label>
        <label>
          {' '}
          Driver notes{' '}
          <input
            value={form.driverNotes}
            onChange={(e) => set('driverNotes', e.target.value)}
          />{' '}
        </label>
        <label>
          {' '}
          Special requirements{' '}
          <input
            value={form.specialRequirements}
            onChange={(e) => set('specialRequirements', e.target.value)}
          />{' '}
        </label>
        <button type="submit">{editingId ? 'Update day' : 'Add day'}</button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY_DAY);
            }}
          >
            Cancel
          </button>
        )}
      </form>
    </section>
  );
}
