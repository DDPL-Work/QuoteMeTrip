/**
 * Job service (Phase 6).
 *
 * Jobs are born in the acceptance transaction (see acceptance.service)
 * with status `accepted`. Transitions: accepted → in_progress →
 * completed, accepted/in_progress → cancelled. Only participants (and
 * read-only admin) may view; status changes are participant-driven.
 */
import { initModels } from '../../db/models/index.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import { JOB_TRANSITIONS } from '../../db/models/Job.js';
import { toPublicJob, jobTravellerSnippet, jobAgencySnippet } from './job.mapper.js';
import { JOB_ERROR_CODES } from './job.constants.js';
import { LIVE_JOB_STATUSES } from '../contact/contact-visibility.js';

async function resolveAgencyId(models, userId) {
  const agency = await models.AgencyProfile.findOne({ where: { userId } });
  if (!agency) {
    throw new NotFoundError('Agency profile not found.', { code: JOB_ERROR_CODES.NOT_FOUND });
  }
  return agency.id;
}

async function loadJob(models, jobId) {
  const job = await models.Job.findByPk(jobId);
  if (!job) {
    throw new NotFoundError('Job not found.', { code: JOB_ERROR_CODES.NOT_FOUND });
  }
  return job;
}

async function assertJobVisible(models, job, userId, role) {
  if (role === 'admin') {
    return;
  }
  if (role === 'traveller' && job.travellerId === Number(userId)) {
    return;
  }
  if (role === 'agency') {
    const agencyId = await resolveAgencyId(models, userId);
    if (job.agencyId === agencyId) {
      return;
    }
  }
  throw new NotFoundError('Job not found.', { code: JOB_ERROR_CODES.NOT_FOUND });
}

async function toPublic(models, job) {
  const revealed = LIVE_JOB_STATUSES.includes(job.status);
  const user = await models.User.findByPk(job.travellerId);
  const profile = await models.TravellerProfile.findOne({ where: { userId: job.travellerId } });
  const agency = await models.AgencyProfile.findByPk(job.agencyId);
  return toPublicJob(job, {
    revealed,
    traveller: jobTravellerSnippet(user, profile, { revealed }),
    agency: jobAgencySnippet(agency, { revealed }),
  });
}

export async function listJobs(userId, role) {
  const models = initModels();
  const where = {};
  if (role === 'traveller') {
    where.travellerId = Number(userId);
  } else if (role === 'agency') {
    where.agencyId = await resolveAgencyId(models, userId);
  } else if (role !== 'admin') {
    throw new ForbiddenError('Only participants can list jobs.', {
      code: JOB_ERROR_CODES.FORBIDDEN,
    });
  }
  const rows = await models.Job.findAll({
    where,
    order: [[models.sequelize.col('Job.updated_at'), 'DESC']],
  });
  const jobs = [];
  for (const row of rows) {
    jobs.push(await toPublic(models, row));
  }
  return jobs;
}

export async function getJob(userId, role, jobId) {
  const models = initModels();
  const job = await loadJob(models, jobId);
  await assertJobVisible(models, job, userId, role);
  return toPublic(models, job);
}

function assertTransition(from, to) {
  const allowed = JOB_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new ValidationError(`Cannot move a job from "${from}" to "${to}".`, {
      code: JOB_ERROR_CODES.INVALID_TRANSITION,
    });
  }
}

export async function updateJobStatus(userId, role, jobId, { status }) {
  if (role === 'admin') {
    throw new ForbiddenError('Administrators cannot change job status.', {
      code: JOB_ERROR_CODES.FORBIDDEN,
    });
  }
  const models = initModels();
  const job = await loadJob(models, jobId);
  await assertJobVisible(models, job, userId, role);
  assertTransition(job.status, status);

  const patch = { status };
  const now = new Date();
  if (status === 'in_progress') {
    patch.startedAt = job.startedAt || now;
  }
  if (status === 'completed') {
    patch.completedAt = now;
  }
  if (status === 'cancelled') {
    patch.cancelledAt = now;
  }
  await job.update(patch);
  return toPublic(models, await loadJob(models, jobId));
}
