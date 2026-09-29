import { useState } from 'react';
import { STOP_TYPES, validateStopInput } from '../features/trip/validation.js';

export function LocationSelector({ onAdd }) {
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', type: 'intermediate' });
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const next = validateStopInput(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onAdd({
      name: form.name.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      type: form.type,
    });
    setForm({ name: '', latitude: '', longitude: '', type: 'intermediate' });
  }

  return (
    <form onSubmit={submit} aria-label="Add stop">
      <h3>Add stop</h3>
      <label>
        {' '}
        Name <input value={form.name} onChange={(e) => set('name', e.target.value)} />{' '}
      </label>
      {errors.name && <p role="alert">{errors.name}</p>}
      <label>
        {' '}
        Latitude{' '}
        <input value={form.latitude} onChange={(e) => set('latitude', e.target.value)} />{' '}
      </label>
      {errors.latitude && <p role="alert">{errors.latitude}</p>}
      <label>
        {' '}
        Longitude{' '}
        <input value={form.longitude} onChange={(e) => set('longitude', e.target.value)} />{' '}
      </label>
      {errors.longitude && <p role="alert">{errors.longitude}</p>}
      <label>
        {' '}
        Type
        <select value={form.type} onChange={(e) => set('type', e.target.value)}>
          {STOP_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Add stop</button>
    </form>
  );
}
