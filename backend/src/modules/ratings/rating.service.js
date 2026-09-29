import { Rating, Job, AgencyProfile, User } from '../../db/models/index.js';

export class RatingService {
  async submitRating(jobId, travellerId, ratingValue) {
    if (ratingValue < 1 || ratingValue > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const job = await Job.findOne({
      where: { id: jobId, travellerId },
    });

    if (!job) {
      throw new Error('Job not found or does not belong to you');
    }

    if (job.status !== 'completed') {
      throw new Error('Can only rate completed jobs');
    }

    // Check if already rated
    const existing = await Rating.findOne({ where: { jobId } });
    if (existing) {
      throw new Error('Job already rated');
    }

    const rating = await Rating.create({
      jobId: job.id,
      travelRequestId: job.travelRequestId,
      travellerId: job.travellerId,
      agencyId: job.agencyId,
      rating: ratingValue,
    });

    return rating;
  }

  async getRatingForJob(jobId) {
    return await Rating.findOne({ where: { jobId } });
  }

  async getAgencyRatingSummary(agencyId) {
    const ratings = await Rating.findAll({ where: { agencyId } });
    if (ratings.length === 0) {
      return { averageRating: 0, ratingCount: 0 };
    }
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return {
      averageRating: Number((sum / ratings.length).toFixed(1)),
      ratingCount: ratings.length,
    };
  }

  async getAllRatings() {
    return await Rating.findAll({
      include: [
        { model: AgencyProfile, as: 'agency', attributes: ['id', 'companyName'] },
        { model: User, as: 'traveller', attributes: ['id', 'name'] },
        { model: Job, as: 'job', attributes: ['id', 'status', 'completedAt'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async getGlobalRatingSummary() {
    const ratings = await Rating.findAll();
    if (ratings.length === 0) return { totalRatings: 0, averageRating: 0 };
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return {
      totalRatings: ratings.length,
      averageRating: Number((sum / ratings.length).toFixed(1)),
    };
  }
}

export const ratingService = new RatingService();
