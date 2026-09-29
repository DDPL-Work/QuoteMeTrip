export function TravelRequirements({ form, onChange }) {
  return (
    <fieldset>
      <legend>Requirements</legend>
      <label>
        <input
          type="checkbox"
          checked={!!form.hotelRequired}
          onChange={(e) => onChange('hotelRequired', e.target.checked)}
        />{' '}
        Hotel
      </label>
      <label>
        <input
          type="checkbox"
          checked={!!form.guideRequired}
          onChange={(e) => onChange('guideRequired', e.target.checked)}
        />{' '}
        Guide
      </label>
      <label>
        <input
          type="checkbox"
          checked={!!form.driverRequired}
          onChange={(e) => onChange('driverRequired', e.target.checked)}
        />{' '}
        Driver
      </label>
    </fieldset>
  );
}
