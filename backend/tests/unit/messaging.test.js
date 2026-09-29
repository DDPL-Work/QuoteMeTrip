/**
 * Phase 6 unit tests (messaging, contact visibility, acceptance, jobs).
 *
 * DB-free: covers message/conversation validation, contact masking +
 * reveal rules, job transition map + status validation, and the
 * membership/socket/acceptance enforcement shapes via source checks
 * plus pure-function assertions.
 */
import 'dotenv/config';

process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import { describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  validateCreateConversationInput,
  validateSendMessageInput,
  validatePagination,
} from '../../src/modules/messaging/message.validation.js';
import {
  MAX_MESSAGE_LENGTH,
  MESSAGE_TYPES,
  CONVERSATION_STATUSES,
} from '../../src/modules/messaging/message.constants.js';
import {
  LIVE_JOB_STATUSES,
  isContactRevealedForRequest,
  getTravellerContact,
  getAgencyContact,
  maskContactDetails,
} from '../../src/modules/contact/contact-visibility.js';
import { JOB_STATUSES, JOB_TRANSITIONS } from '../../src/db/models/Job.js';
import { JOB_ERROR_CODES } from '../../src/modules/jobs/job.constants.js';
import { validateJobStatusInput } from '../../src/modules/jobs/job.validation.js';
import { MESSAGE_ERROR_CODES } from '../../src/modules/messaging/message.constants.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoSource = (rel) => readFileSync(path.join(here, '..', '..', 'src', rel), 'utf8');

describe('message validation', () => {
  test('empty and whitespace-only bodies are rejected', () => {
    assert.throws(() => validateSendMessageInput({}), /must not be empty/);
    assert.throws(() => validateSendMessageInput({ body: '' }), /must not be empty/);
    assert.throws(() => validateSendMessageInput({ body: '   ' }), /must not be empty/);
    assert.throws(() => validateSendMessageInput({ body: 42 }), /must not be empty/);
  });

  test('oversize bodies are rejected at 5000 chars', () => {
    assert.strictEqual(MAX_MESSAGE_LENGTH, 5000);
    assert.throws(
      () => validateSendMessageInput({ body: 'x'.repeat(MAX_MESSAGE_LENGTH + 1) }),
      /at most 5000/,
    );
    const ok = validateSendMessageInput({ body: `  ${'y'.repeat(MAX_MESSAGE_LENGTH)}  ` });
    assert.strictEqual(ok.body.length, MAX_MESSAGE_LENGTH);
  });

  test('bodies are trimmed before storing', () => {
    assert.deepStrictEqual(validateSendMessageInput({ body: '  hello  ' }), { body: 'hello' });
  });

  test('message type and conversation status enums are registered', () => {
    assert.ok(MESSAGE_TYPES.includes('text'));
    assert.ok(MESSAGE_TYPES.includes('system'));
    assert.ok(CONVERSATION_STATUSES.includes('active'));
    assert.ok(CONVERSATION_STATUSES.includes('closed'));
  });
});

describe('conversation creation rules', () => {
  test('travelRequestId is required and must be a positive integer', () => {
    assert.throws(() => validateCreateConversationInput({}), /travelRequestId is required/);
    assert.throws(
      () => validateCreateConversationInput({ travelRequestId: 0 }),
      /positive integer/,
    );
    assert.throws(
      () => validateCreateConversationInput({ travelRequestId: 'abc' }),
      /positive integer/,
    );
    const out = validateCreateConversationInput({ travelRequestId: '7', agencyId: 3 });
    assert.deepStrictEqual(out, { travelRequestId: 7, agencyId: 3 });
  });

  test('agencyId is optional but must be a positive integer when present', () => {
    assert.deepStrictEqual(validateCreateConversationInput({ travelRequestId: 1 }), {
      travelRequestId: 1,
    });
    assert.throws(
      () => validateCreateConversationInput({ travelRequestId: 1, agencyId: -2 }),
      /positive integer/,
    );
  });

  test('pagination defaults and bounds are enforced', () => {
    assert.deepStrictEqual(validatePagination({}), { page: 1, pageSize: 20 });
    assert.throws(() => validatePagination({ page: 0 }), /page must be/);
    assert.throws(() => validatePagination({ pageSize: 101 }), /pageSize must be/);
  });

  test('service guards: admin cannot open, traveller needs quoting agency, agency needs match', () => {
    const source = repoSource('modules/messaging/message.service.js');
    assert.match(source, /Administrators cannot open conversations/);
    assert.match(source, /agencyId is required to open a conversation/);
    assert.match(source, /only message agencies that quoted this request/);
    assert.match(source, /You can only open conversations as your own agency/);
    assert.match(source, /status:\s*\['submitted',\s*'accepted',\s*'rejected'\]/);
  });

  test('duplicate triple returns the existing conversation (idempotent open)', () => {
    const source = repoSource('modules/messaging/message.service.js');
    assert.match(source, /travelRequestId: request\.id, travellerId, agencyId/);
    assert.match(source, /created: false/);
    assert.match(source, /created: true/);
    assert.strictEqual(MESSAGE_ERROR_CODES.DUPLICATE, 'CONVERSATION_DUPLICATE');
  });
});

describe('contact masking + reveal rule', () => {
  test('live job statuses reveal contact; cancelled hides it again', () => {
    assert.deepStrictEqual([...LIVE_JOB_STATUSES].sort(), ['accepted', 'completed', 'in_progress']);
    assert.ok(!LIVE_JOB_STATUSES.includes('cancelled'));
  });

  test('reveal check queries jobs with the live statuses', () => {
    const source = repoSource('modules/contact/contact-visibility.js');
    assert.match(source, /status:\s*LIVE_JOB_STATUSES/);
    assert.strictEqual(typeof isContactRevealedForRequest, 'function');
  });

  test('hidden traveller snippet exposes firstName only', () => {
    const out = getTravellerContact(
      { email: 'secret@example.com' },
      { firstName: 'Ada', lastName: 'Lovelace', phone: '+90-secret' },
      { revealed: false },
    );
    assert.deepStrictEqual(out, { firstName: 'Ada' });
  });

  test('revealed traveller snippet exposes full contact', () => {
    const out = getTravellerContact(
      { email: 'ada@example.com' },
      { firstName: 'Ada', lastName: 'Lovelace', phone: '+90111' },
      { revealed: true },
    );
    assert.strictEqual(out.email, 'ada@example.com');
    assert.strictEqual(out.phone, '+90111');
    assert.strictEqual(out.lastName, 'Lovelace');
  });

  test('hidden agency snippet omits contact fields; revealed includes them', () => {
    const agency = {
      id: 3,
      agencyName: 'Sun',
      city: 'Istanbul',
      country: 'Turkiye',
      contactPerson: 'Owner',
      businessEmail: 'biz@example.com',
      phone: '+90222',
    };
    const hidden = getAgencyContact(agency, { revealed: false });
    assert.ok(!('businessEmail' in hidden));
    assert.ok(!('phone' in hidden));
    assert.strictEqual(hidden.agencyName, 'Sun');
    const revealed = getAgencyContact(agency, { revealed: true });
    assert.strictEqual(revealed.businessEmail, 'biz@example.com');
    assert.strictEqual(revealed.phone, '+90222');
    assert.strictEqual(getAgencyContact(null), null);
  });

  test('maskContactDetails hides emails and phone-like numbers, keeps plain text', () => {
    assert.strictEqual(maskContactDetails('hello world'), 'hello world');
    assert.strictEqual(maskContactDetails(null), null);
    assert.strictEqual(maskContactDetails(undefined), undefined);
    const masked = maskContactDetails('mail me at ada@example.com or +90 555 111 2233 thanks');
    assert.ok(!masked.includes('ada@example.com'), 'email should be masked');
    assert.ok(!masked.includes('555'), 'phone should be masked');
    assert.ok(masked.includes('thanks'), 'surrounding text should survive');
    assert.ok(masked.includes('[hidden contact]'));
  });
});

describe('acceptance validation rules', () => {
  test('non-traveller roles are forbidden before any DB work', async () => {
    const { acceptQuotation } = await import('../../src/modules/acceptance/acceptance.service.js');
    await assert.rejects(
      acceptQuotation(1, 1, { role: 'agency' }),
      /Only travellers can accept quotations/,
    );
    await assert.rejects(
      acceptQuotation(1, 1, { role: 'admin' }),
      /Only travellers can accept quotations/,
    );
  });

  test('service enforces submitted quotation + submitted request + ownership', () => {
    const source = repoSource('modules/acceptance/acceptance.service.js');
    assert.match(source, /Only submitted quotations can be accepted/);
    assert.match(source, /already has an accepted quotation/);
    assert.match(source, /cannot accept quotations in its current state/);
    assert.match(source, /request\.travellerId !== Number\(userId\)/);
  });

  test('acceptance rejects rivals and emits the three post-commit events', () => {
    const source = repoSource('modules/acceptance/acceptance.service.js');
    assert.match(source, /status:\s*'rejected'/);
    assert.match(source, /QUOTATION_ACCEPTED/);
    assert.match(source, /JOB_CREATED/);
    assert.match(source, /CONTACT_REVEALED/);
  });

  test('already-accepted quotation takes the idempotent fast path', () => {
    const source = repoSource('modules/acceptance/acceptance.service.js');
    assert.match(source, /existing\.status === 'accepted'/);
  });
});

describe('job transitions', () => {
  test('accepted → in_progress → completed; accepted/in_progress → cancelled', () => {
    assert.deepStrictEqual(JOB_TRANSITIONS.accepted, ['in_progress', 'cancelled']);
    assert.deepStrictEqual(JOB_TRANSITIONS.in_progress, ['completed', 'cancelled']);
    assert.deepStrictEqual(JOB_TRANSITIONS.completed, []);
    assert.deepStrictEqual(JOB_TRANSITIONS.cancelled, []);
    for (const name of ['accepted', 'in_progress', 'completed', 'cancelled']) {
      assert.ok(JOB_STATUSES.includes(name), `${name} should exist`);
    }
  });

  test('validateJobStatusInput accepts known statuses only', () => {
    for (const status of JOB_STATUSES) {
      assert.deepStrictEqual(validateJobStatusInput({ status }), { status });
    }
    assert.throws(() => validateJobStatusInput({ status: 'archived' }), /must be one of/);
    assert.throws(() => validateJobStatusInput({}), /must be one of/);
    assert.strictEqual(JOB_ERROR_CODES.INVALID_TRANSITION, 'JOB_INVALID_TRANSITION');
  });
});

describe('membership enforcement shape', () => {
  test('assertConversationMember 404s strangers; admin bypasses membership', () => {
    const source = repoSource('modules/messaging/message.service.js');
    assert.match(source, /export async function assertConversationMember/);
    assert.match(source, /if \(role === 'admin'\)/);
    assert.match(source, /conversation\.travellerId === Number\(userId\)/);
    assert.match(source, /conversation\.agencyId === agency\.id/);
  });

  test('admin send/mark-read are forbidden; closed conversations reject sends', () => {
    const source = repoSource('modules/messaging/message.service.js');
    assert.match(source, /Administrators cannot send messages/);
    assert.match(source, /Administrators cannot mark messages as read/);
    assert.match(source, /This conversation is closed/);
    assert.match(source, /MESSAGE_RECEIVED/);
  });

  test('socket layer authenticates on handshake and has no send path', () => {
    const source = repoSource('realtime/socket.js');
    assert.match(source, /verifyAccessToken/);
    assert.match(source, /Authentication required/);
    assert.match(source, /conversation:join/);
    assert.match(source, /assertConversationMember/);
    assert.ok(!source.includes('conversation:send'), 'no socket send path should exist');
    assert.ok(!source.includes('message:send'), 'no socket send path should exist');
  });
});
