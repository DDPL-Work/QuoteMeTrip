/**
 * Blue Cruise unit tests (validation & model definition).
 */
import assert from 'node:assert';
import { describe, test } from 'node:test';
import { PACKAGE_TYPES, CRUISE_DURATIONS } from '../../src/db/models/TravelRequest.js';
import { validateCreateRequestInput } from '../../src/modules/travel-requests/travel-requests.validation.js';

describe('Blue Cruise unit validation & constants', () => {
  test('PACKAGE_TYPES includes blue_cruise as first package option', () => {
    assert.strictEqual(PACKAGE_TYPES[0], 'blue_cruise');
  });

  test('CRUISE_DURATIONS contains 4d_3n and 6d_5n', () => {
    assert.deepStrictEqual(CRUISE_DURATIONS, ['4d_3n', '6d_5n']);
  });

  test('validates valid blue_cruise request input', () => {
    const output = validateCreateRequestInput({
      routeId: 1,
      packageType: 'blue_cruise',
      cruiseDuration: '4d_3n',
      travelStartDate: '2026-10-01',
      travelEndDate: '2026-10-04',
    });
    assert.strictEqual(output.packageType, 'blue_cruise');
    assert.strictEqual(output.cruiseDuration, '4d_3n');
  });

  test('validates 6d_5n cruiseDuration', () => {
    const output = validateCreateRequestInput({
      routeId: 1,
      packageType: 'blue_cruise',
      cruiseDuration: '6d_5n',
    });
    assert.strictEqual(output.packageType, 'blue_cruise');
    assert.strictEqual(output.cruiseDuration, '6d_5n');
  });

  test('rejects malformed cruise duration 7d_6n with validation error', () => {
    assert.throws(
      () =>
        validateCreateRequestInput({
          routeId: 1,
          packageType: 'blue_cruise',
          cruiseDuration: '7d_6n',
        }),
      (err) => {
        assert.ok(err.message.includes('Cruise duration must be one of'));
        return true;
      },
    );
  });

  test('rejects missing cruise duration for blue_cruise', () => {
    assert.throws(
      () =>
        validateCreateRequestInput({
          routeId: 1,
          packageType: 'blue_cruise',
        }),
      (err) => {
        assert.ok(err.message.includes('Cruise duration is required'));
        return true;
      },
    );
  });

  test('preserves backward compatibility for existing package types', () => {
    for (const pkg of ['full_package', 'hotel_only', 'vehicle_driver']) {
      const output = validateCreateRequestInput({
        routeId: 1,
        packageType: pkg,
      });
      assert.strictEqual(output.packageType, pkg);
    }
  });
});
