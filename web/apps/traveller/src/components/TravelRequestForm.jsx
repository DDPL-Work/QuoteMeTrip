import { useState } from 'react';
import { ACCOMMODATION_OPTIONS, validateRequestInput } from '../features/trip/validation.js';
import { PackageSelector } from './PackageSelector.jsx';
import { TravelRequirements } from './TravelRequirements.jsx';

const EMPTY = {
  travelStartDate: '',
  travelEndDate: '',
  numberOfTravellers: 1,
  luggageCount: 0,
  accommodationType: '',
  hotelRequired: false,
  guideRequired: false,
  driverRequired: false,
  packageType: '',
  specialRequests: '',
};

export function TravelRequestForm({ initial = {}, onSubmit, submitting = false }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const next = validateRequestInput(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={submit} aria-label="Travel request">
      <h3>Travel request</h3>
      <label>
        {' '}
        Start date{' '}
        <input
          value={form.travelStartDate}
          onChange={(e) => set('travelStartDate', e.target.value)}
          placeholder="YYYY-MM-DD"
        />{' '}
      </label>
      {errors.travelStartDate && <p role="alert">{errors.travelStartDate}</p>}
      <label>
        {' '}
        End date{' '}
        <input
          value={form.travelEndDate}
          onChange={(e) => set('travelEndDate', e.target.value)}
          placeholder="YYYY-MM-DD"
        />{' '}
      </label>
      {errors.travelEndDate && <p role="alert">{errors.travelEndDate}</p>}
      <label>
        {' '}
        Travellers{' '}
        <input
          type="number"
          value={form.numberOfTravellers}
          onChange={(e) => set('numberOfTravellers', e.target.value)}
        />{' '}
      </label>
      {errors.numberOfTravellers && <p role="alert">{errors.numberOfTravellers}</p>}
      <label>
        {' '}
        Luggage{' '}
        <input
          type="number"
          value={form.luggageCount}
          onChange={(e) => set('luggageCount', e.target.value)}
        />{' '}
      </label>
      {errors.luggageCount && <p role="alert">{errors.luggageCount}</p>}
      <label>
        {' '}
        Accommodation
        <select
          value={form.accommodationType}
          onChange={(e) => set('accommodationType', e.target.value)}
        >
          <option value="">Select…</option>
          {ACCOMMODATION_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <TravelRequirements form={form} onChange={set} />
      <PackageSelector value={form.packageType} onChange={(v) => set('packageType', v)} />
      <label>
        {' '}
        Special requests{' '}
        <textarea
          value={form.specialRequests}
          onChange={(e) => set('specialRequests', e.target.value)}
        />{' '}
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save request'}
      </button>
    </form>
  );
}
