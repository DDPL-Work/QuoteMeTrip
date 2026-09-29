import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ratingService } from './rating.service.js';

export const ratingRoutes = Router();

ratingRoutes.post(
  '/jobs/:jobId/rating',
  authenticate,
  authorize('traveller'),
  async (req, res, next) => {
    try {
      const { rating } = req.body;
      const newRating = await ratingService.submitRating(
        req.params.jobId,
        req.user.id,
        parseInt(rating, 10),
      );
      res.status(201).json({ status: 'success', data: newRating });
    } catch (err) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  },
);

ratingRoutes.get('/jobs/:jobId/rating', authenticate, async (req, res, next) => {
  try {
    const rating = await ratingService.getRatingForJob(req.params.jobId);
    res.json({ status: 'success', data: rating });
  } catch (err) {
    next(err);
  }
});

export const agencyRatingRoutes = Router();
agencyRatingRoutes.get('/:id/rating-summary', async (req, res, next) => {
  try {
    const summary = await ratingService.getAgencyRatingSummary(req.params.id);
    res.json({ status: 'success', data: summary });
  } catch (err) {
    next(err);
  }
});

export const adminRatingRoutes = Router();
adminRatingRoutes.use(authenticate, authorize('admin'));
adminRatingRoutes.get('/', async (req, res, next) => {
  try {
    const ratings = await ratingService.getAllRatings();
    res.json({ status: 'success', data: ratings });
  } catch (err) {
    next(err);
  }
});

adminRatingRoutes.get('/summary', async (req, res, next) => {
  try {
    const summary = await ratingService.getGlobalRatingSummary();
    res.json({ status: 'success', data: summary });
  } catch (err) {
    next(err);
  }
});
