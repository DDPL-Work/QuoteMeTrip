/**
 * Phase 5 unit tests (agency matching + quotations).
 *
 * No database required: covers the eligibility extension point, the
 * duplicate-prevention contract, quotation validation (including the
 * server-totals rule), server-side total calculation, the quotation
 * lifecycle map, and the contact-protection mappers.
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import { describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  isAgencyEligibleForRequest,
  explainAgencyEligibility,
} from '../../src/modules/agency-matching/matching.service.js';
import {
  MATCH_ELIGIBLE_AGENCY_STATUSES,
  INBOX_VISIBLE_MATCH_STATUSES,
  TRAVEL_REQUEST_AGENCY_STATUSES,
} from '../../src/modules/agency-matching/matching.constants.js';
import {
  validateInboxQuery,
  validatePagination,
} from '../../src/modules/agency-matching/matching.validation.js';
import {
  QUOTATION_STATUSES,
  QUOTATION_TYPES,
  QUOTATION_TRANSITIONS,
} from '../../src/db/models/Quotation.js';
import { QUOTATION_ITEM_TYPES } from '../../src/db/models/QuotationItem.js';
import {
  ACTIVE_QUOTATION_STATUSES,
  QUOTATION_ERROR_CODES,
} from '../../src/modules/quotations/quotation.constants.js';
import {
  validateCreateQuotationInput,
  validatePatchQuotationInput,
  validateQuotationItemInput,
  validateItemsList,
} from '../../src/modules/quotations/quotation.validation.js';
import { calculateTotals } from '../../src/modules/quotations/quotation.service.js';
import {
  toPublicQuotation,
  toPublicAgencySnippet,
} from '../../src/modules/quotations/quotation.mapper.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoSource = (rel) => readFileSync(path.join(here, '..', '..', 'src', rel), 'utf8');

const futureDate = '2030-06-01';
const validItems = () => [
  { title: 'Hotel stay', itemType: 'hotel', quantity: 2, unitPrice: 100 },
  { title: 'Airport transfer', itemType: 'vehicle', quantity: 1, unitPrice: 49.99 },
];

describe('matching eligibility engine (Phase 5.3)', () => {
  const mockApprovedAgency = () => ({
    id: 1,
    status: 'approved',
    user: { id: 10, status: 'active', role: 'agency' },
    memberships: [{ id: 1, status: 'active', startsAt: '2020-01-01', endsAt: null }],
    coverages: [
      { id: 1, locationName: 'Istanbul' },
      { id: 2, locationName: 'Cappadocia' },
    ],
    capabilities: [
      { id: 1, serviceType: 'hotel', isEnabled: true },
      { id: 2, serviceType: 'full_package', isEnabled: true },
    ],
  });

  const mockRequest = () => ({
    id: 100,
    packageType: 'full_package',
    hotelRequired: true,
    route: {
      startLocation: 'Istanbul',
      finalDestination: 'Cappadocia',
      stops: [],
    },
    days: [],
  });

  test('fully compliant agency is ELIGIBLE', () => {
    const agency = mockApprovedAgency();
    const request = mockRequest();
    assert.strictEqual(isAgencyEligibleForRequest(agency, request), true);
    const explanation = explainAgencyEligibility(agency, request);
    assert.strictEqual(explanation.eligible, true);
    assert.deepStrictEqual(explanation.reasons, []);
  });

  test('suspended agency is EXCLUDED (AGENCY_SUSPENDED)', () => {
    const agency = mockApprovedAgency();
    agency.status = 'suspended';
    const request = mockRequest();
    assert.strictEqual(isAgencyEligibleForRequest(agency, request), false);
    const explanation = explainAgencyEligibility(agency, request);
    assert.strictEqual(explanation.eligible, false);
    assert.ok(explanation.reasons.includes('AGENCY_SUSPENDED'));
  });

  test('pending agency is EXCLUDED (AGENCY_PENDING)', () => {
    const agency = mockApprovedAgency();
    agency.status = 'pending';
    const request = mockRequest();
    assert.strictEqual(isAgencyEligibleForRequest(agency, request), false);
    const explanation = explainAgencyEligibility(agency, request);
    assert.strictEqual(explanation.eligible, false);
    assert.ok(explanation.reasons.includes('AGENCY_PENDING'));
  });

  test('inactive user account is EXCLUDED (USER_INACTIVE)', () => {
    const agency = mockApprovedAgency();
    agency.user.status = 'inactive';
    const request = mockRequest();
    assert.strictEqual(isAgencyEligibleForRequest(agency, request), false);
    const explanation = explainAgencyEligibility(agency, request);
    assert.strictEqual(explanation.eligible, false);
    assert.ok(explanation.reasons.includes('USER_INACTIVE'));
  });

  test('inactive/expired membership is EXCLUDED (MEMBERSHIP_INACTIVE)', () => {
    const agency = mockApprovedAgency();
    agency.memberships = [
      { id: 1, status: 'expired', startsAt: '2020-01-01', endsAt: '2021-01-01' },
    ];
    const request = mockRequest();
    assert.strictEqual(isAgencyEligibleForRequest(agency, request), false);
    const explanation = explainAgencyEligibility(agency, request);
    assert.strictEqual(explanation.eligible, false);
    assert.ok(explanation.reasons.includes('MEMBERSHIP_INACTIVE'));
  });

  test('empty coverage is EXCLUDED (EMPTY_COVERAGE)', () => {
    const agency = mockApprovedAgency();
    agency.coverages = [];
    const request = mockRequest();
    assert.strictEqual(isAgencyEligibleForRequest(agency, request), false);
    const explanation = explainAgencyEligibility(agency, request);
    assert.strictEqual(explanation.eligible, false);
    assert.ok(explanation.reasons.includes('EMPTY_COVERAGE'));
  });

  test('coverage mismatch is EXCLUDED (COVERAGE_MISMATCH)', () => {
    const agency = mockApprovedAgency();
    agency.coverages = [{ id: 1, locationName: 'Bodrum' }];
    const request = mockRequest();
    assert.strictEqual(isAgencyEligibleForRequest(agency, request), false);
    const explanation = explainAgencyEligibility(agency, request);
    assert.strictEqual(explanation.eligible, false);
    assert.ok(explanation.reasons.includes('COVERAGE_MISMATCH'));
  });

  test('empty capabilities is EXCLUDED (EMPTY_SERVICES)', () => {
    const agency = mockApprovedAgency();
    agency.capabilities = [{ id: 1, serviceType: 'hotel', isEnabled: false }];
    const request = mockRequest();
    assert.strictEqual(isAgencyEligibleForRequest(agency, request), false);
    const explanation = explainAgencyEligibility(agency, request);
    assert.strictEqual(explanation.eligible, false);
    assert.ok(explanation.reasons.includes('EMPTY_SERVICES'));
  });

  test('capability mismatch is EXCLUDED (SERVICE_MISMATCH)', () => {
    const agency = mockApprovedAgency();
    agency.capabilities = [{ id: 1, serviceType: 'hotel', isEnabled: true }];
    const request = mockRequest();
    request.packageType = 'blue_cruise';
    assert.strictEqual(isAgencyEligibleForRequest(agency, request), false);
    const explanation = explainAgencyEligibility(agency, request);
    assert.strictEqual(explanation.eligible, false);
    assert.ok(explanation.reasons.includes('SERVICE_MISMATCH'));
  });
});

describe('DB eligibility rules', () => {
  test('DB eligibility constants: approved profile, active user/membership implied', () => {
    assert.deepStrictEqual(MATCH_ELIGIBLE_AGENCY_STATUSES, ['approved']);
    assert.ok(INBOX_VISIBLE_MATCH_STATUSES.includes('matched'));
    assert.ok(INBOX_VISIBLE_MATCH_STATUSES.includes('viewed'));
    assert.ok(INBOX_VISIBLE_MATCH_STATUSES.includes('quoted'));
    assert.deepStrictEqual(
      [...TRAVEL_REQUEST_AGENCY_STATUSES].sort(),
      ['declined', 'expired', 'matched', 'quoted', 'viewed', 'withdrawn'].sort(),
    );
  });

  test('eligible-agencies query enforces approved/active/window rules', () => {
    const source = repoSource('modules/agency-matching/matching.repository.js');
    assert.match(source, /status:\s*['"]approved['"]/);
    assert.match(source, /status:\s*['"]active['"]/);
    assert.match(source, /startsAt/);
    assert.match(source, /endsAt/);
  });
});

describe('match duplicate prevention', () => {
  test('findExistingMatch looks up the exact request/agency pair', () => {
    const source = repoSource('modules/agency-matching/matching.repository.js');
    assert.match(source, /findExistingMatch/);
    assert.match(source, /findOne\(\{\s*where:\s*\{\s*travelRequestId,\s*agencyId/);
  });

  test('createMatch is idempotent via findOrCreate on the unique pair', () => {
    const source = repoSource('modules/agency-matching/matching.repository.js');
    assert.match(source, /createMatch/);
    assert.match(source, /findOrCreate/);
    assert.match(source, /where:\s*\{\s*travelRequestId,\s*agencyId\s*\}/);
  });

  test('matching pipeline skips already-matched pairs (no duplicates)', () => {
    const source = repoSource('modules/agency-matching/matching.service.js');
    assert.match(source, /findExistingMatch/);
    assert.match(source, /if\s*\(existing\)\s*\{\s*continue/);

    // Pure model of the pipeline loop: existing pairs are skipped,
    // new pairs are created exactly once.
    const seen = new Set(['1:7']);
    const created = [];
    for (const agency of [{ id: 7 }, { id: 8 }, { id: 8 }]) {
      const key = `1:${agency.id}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      created.push(key);
    }
    assert.deepStrictEqual(created, ['1:8']);
  });
});

describe('quotation item validation', () => {
  test('items are required on create', () => {
    assert.throws(
      () => validateCreateQuotationInput({ quotationType: 'hotel_only' }),
      /At least one quotation item/,
    );
    assert.throws(
      () => validateCreateQuotationInput({ quotationType: 'hotel_only', items: [] }),
      /non-empty array/,
    );
    assert.throws(
      () => validateItemsList('nope', { required: true }),
      /must be an object|non-empty array/,
    );
  });

  test('bad item types are rejected', () => {
    assert.throws(
      () => validateQuotationItemInput({ title: 'X', itemType: 'teleport' }),
      /invalid type/,
    );
    const ok = validateQuotationItemInput({
      title: 'Guide',
      itemType: 'guide',
      quantity: 1,
      unitPrice: 10,
    });
    assert.strictEqual(ok.itemType, 'guide');
  });

  test('item titles, quantities, and prices are enforced', () => {
    assert.throws(() => validateQuotationItemInput({ title: '  ' }), /requires a title/);
    assert.throws(() => validateQuotationItemInput({ title: 'X', quantity: 0 }), /quantity/);
    assert.throws(() => validateQuotationItemInput({ title: 'X', unitPrice: -5 }), /unit price/);
    assert.throws(
      () => validateQuotationItemInput({ title: 'X', unitPrice: 'free' }),
      /unit price/,
    );
  });

  test('quotationType must be a known enum value', () => {
    assert.throws(
      () => validateCreateQuotationInput({ quotationType: 'everything', items: validItems() }),
      /quotationType must be one of/,
    );
    for (const type of QUOTATION_TYPES) {
      const out = validateCreateQuotationInput({ quotationType: type, items: validItems() });
      assert.strictEqual(out.quotationType, type);
    }
  });

  test('client-supplied totals are rejected on create and patch', () => {
    for (const totals of [{ subtotal: 10 }, { totalAmount: 10 }, { total_amount: 10 }]) {
      assert.throws(
        () =>
          validateCreateQuotationInput({
            quotationType: 'hotel_only',
            items: validItems(),
            ...totals,
          }),
        /calculated by the server/,
      );
      assert.throws(() => validatePatchQuotationInput({ ...totals }), /calculated by the server/);
    }
  });

  test('currency must be a 3-letter ISO code', () => {
    assert.throws(
      () =>
        validateCreateQuotationInput({
          quotationType: 'hotel_only',
          items: validItems(),
          currency: 'US',
        }),
      /3-letter ISO/,
    );
    assert.throws(
      () =>
        validateCreateQuotationInput({
          quotationType: 'hotel_only',
          items: validItems(),
          currency: 'USDD',
        }),
      /3-letter ISO/,
    );
    const out = validateCreateQuotationInput({
      quotationType: 'hotel_only',
      items: validItems(),
      currency: 'eur',
    });
    assert.strictEqual(out.currency, 'EUR');
  });

  test('validUntil must be a non-past YYYY-MM-DD date', () => {
    assert.throws(
      () =>
        validateCreateQuotationInput({
          quotationType: 'hotel_only',
          items: validItems(),
          validUntil: 'not-a-date',
        }),
      /YYYY-MM-DD/,
    );
    assert.throws(
      () =>
        validateCreateQuotationInput({
          quotationType: 'hotel_only',
          items: validItems(),
          validUntil: '2000-01-01',
        }),
      /cannot be in the past/,
    );
    const out = validateCreateQuotationInput({
      quotationType: 'hotel_only',
      items: validItems(),
      validUntil: futureDate,
    });
    assert.strictEqual(out.validUntil, futureDate);
  });

  test('patch input rejects unknown fields and empty updates', () => {
    assert.throws(() => validatePatchQuotationInput({ bogus: 1 }), /Unknown quotation fields/);
    assert.throws(() => validatePatchQuotationInput({}), /Nothing to update/);
    const out = validatePatchQuotationInput({
      notes: 'Updated',
      currency: 'USD',
      validUntil: futureDate,
    });
    assert.strictEqual(out.notes, 'Updated');
  });
});

describe('calculateTotals', () => {
  test('computes quantity × unit price per line, subtotal equals total', () => {
    const { lines, subtotal, total } = calculateTotals(validItems());
    assert.strictEqual(lines[0].lineTotal, 200);
    assert.strictEqual(lines[1].lineTotal, 49.99);
    assert.strictEqual(subtotal, 249.99);
    assert.strictEqual(total, subtotal);
  });

  test('rounds to cents without float drift', () => {
    const { lines, subtotal, total } = calculateTotals([
      { quantity: 3, unitPrice: 19.99 },
      { quantity: 0.1, unitPrice: 0.2 },
    ]);
    assert.strictEqual(lines[0].lineTotal, 59.97);
    assert.strictEqual(lines[1].lineTotal, 0.02);
    assert.strictEqual(subtotal, 59.99);
    assert.strictEqual(total, subtotal);
  });

  test('service never trusts client totals (recalculates from lines)', () => {
    const source = repoSource('modules/quotations/quotation.service.js');
    assert.match(source, /calculateTotals\(input\.items\)/);
    assert.match(source, /Recalculate from stored lines/);
  });
});

describe('quotation lifecycle', () => {
  test('draft → submitted/withdrawn, submitted → withdrawn', () => {
    assert.deepStrictEqual([...QUOTATION_TRANSITIONS.draft].sort(), ['submitted', 'withdrawn']);
    assert.deepStrictEqual(QUOTATION_TRANSITIONS.submitted, ['withdrawn']);
  });

  test('submitted → accepted is rejected; terminal states have no transitions', () => {
    assert.ok(!QUOTATION_TRANSITIONS.submitted.includes('accepted'));
    assert.ok(!QUOTATION_TRANSITIONS.submitted.includes('rejected'));
    for (const state of ['withdrawn', 'expired', 'accepted', 'rejected']) {
      assert.deepStrictEqual(QUOTATION_TRANSITIONS[state], [], `${state} should be terminal`);
    }
  });

  test('only drafts are editable (service + validation enforce it)', () => {
    const source = repoSource('modules/quotations/quotation.service.js');
    assert.match(source, /assertDraft\(quotation\)/);
    assert.match(source, /Only draft quotations can be edited/);
    // Empty patches are rejected before touching the service.
    assert.throws(() => validatePatchQuotationInput({}), /Nothing to update/);
  });

  test('duplicate guard covers draft + submitted; withdrawn frees the pair', () => {
    assert.deepStrictEqual([...ACTIVE_QUOTATION_STATUSES].sort(), ['draft', 'submitted']);
    const repo = repoSource('modules/quotations/quotation.repository.js');
    assert.match(repo, /status:\s*\['draft',\s*'submitted'\]/);
    assert.strictEqual(QUOTATION_ERROR_CODES.DUPLICATE, 'QUOTATION_DUPLICATE');
  });

  test('quotation statuses and item types are registered', () => {
    for (const name of ['draft', 'submitted', 'withdrawn', 'accepted', 'rejected']) {
      assert.ok(QUOTATION_STATUSES.includes(name), `${name} should exist`);
    }
    for (const name of ['hotel', 'vehicle', 'driver', 'guide', 'service', 'other']) {
      assert.ok(QUOTATION_ITEM_TYPES.includes(name), `${name} should exist`);
    }
  });
});

describe('quotation ownership + contact protection', () => {
  test('agency snippet exposes business fields only (no email/phone)', () => {
    const snippet = toPublicAgencySnippet({
      id: 3,
      agencyName: 'Sun Travel',
      city: 'Istanbul',
      country: 'Turkiye',
      email: 'secret@example.com',
      phone: '+90-secret',
    });
    assert.deepStrictEqual(Object.keys(snippet).sort(), ['agencyName', 'city', 'country', 'id']);
    assert.strictEqual(snippet.agencyName, 'Sun Travel');
    assert.strictEqual(toPublicAgencySnippet(null), null);
  });

  test('traveller quotations include the agency snippet; agency views omit it', () => {
    const base = {
      id: 1,
      travelRequestId: 2,
      agencyId: 3,
      status: 'submitted',
      quotationType: 'hotel_only',
      currency: 'USD',
      subtotal: 10,
      totalAmount: 10,
      validUntil: null,
      notes: null,
      submittedAt: null,
      items: [],
      createdAt: null,
      updatedAt: null,
    };
    const withAgency = toPublicQuotation(base, {
      agency: { id: 3, agencyName: 'Sun', email: 'secret@example.com', phone: 'secret' },
    });
    assert.strictEqual(withAgency.agency.agencyName, 'Sun');
    assert.ok(!('email' in withAgency.agency), 'agency email must not leak to travellers');
    assert.ok(!('phone' in withAgency.agency), 'agency phone must not leak to travellers');

    const own = toPublicQuotation(base);
    assert.strictEqual(own.agency, undefined);
  });

  test('quotation items are sorted and coerced to numbers', () => {
    const out = toPublicQuotation({
      id: 1,
      travelRequestId: 2,
      agencyId: 3,
      status: 'draft',
      quotationType: 'hotel_only',
      currency: 'USD',
      subtotal: '10.00',
      totalAmount: '10.00',
      validUntil: null,
      notes: null,
      submittedAt: null,
      items: [
        { id: 9, itemType: 'other', title: 'B', quantity: '1', unitPrice: '4', totalPrice: '4' },
        { id: 4, itemType: 'other', title: 'A', quantity: '2', unitPrice: '3', totalPrice: '6' },
      ],
      createdAt: null,
      updatedAt: null,
    });
    assert.deepStrictEqual(
      out.items.map((i) => i.title),
      ['A', 'B'],
    );
    assert.strictEqual(out.subtotal, 10);
    assert.strictEqual(typeof out.items[0].quantity, 'number');
  });

  test('cross-owner access is a 404 by design (no existence leak)', () => {
    const source = repoSource('modules/quotations/quotation.service.js');
    assert.match(source, /quotation\.agencyId !== agency\.id/);
    assert.match(source, /unmatched agency must not learn/);
  });
});

describe('inbox query validation', () => {
  test('pagination defaults and bounds are enforced', () => {
    assert.deepStrictEqual(validatePagination({}), { page: 1, pageSize: 20 });
    assert.throws(() => validatePagination({ page: 0 }), /page must be/);
    assert.throws(() => validatePagination({ pageSize: 101 }), /pageSize must be/);
  });

  test('unknown matchStatus values are rejected', () => {
    assert.throws(() => validateInboxQuery({ matchStatus: 'maybe' }), /matchStatus must be/);
    const out = validateInboxQuery({ matchStatus: 'quoted', page: '2', pageSize: '5' });
    assert.strictEqual(out.matchStatus, 'quoted');
    assert.strictEqual(out.page, 2);
  });
});
