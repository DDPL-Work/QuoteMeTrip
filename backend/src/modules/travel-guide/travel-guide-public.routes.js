import { Router } from 'express';
import { travelGuideService } from './travel-guide.service.js';

export const travelGuidePublicRoutes = Router();

travelGuidePublicRoutes.get('/regions', async (req, res, next) => {
  try {
    const regions = await travelGuideService.getRegions(true);
    res.json({ status: 'success', data: regions });
  } catch (err) {
    next(err);
  }
});

travelGuidePublicRoutes.get('/destinations', async (req, res, next) => {
  try {
    const dests = await travelGuideService.getDestinations(true, req.query.regionId);
    res.json({ status: 'success', data: dests });
  } catch (err) {
    next(err);
  }
});

travelGuidePublicRoutes.get('/destinations/:slug', async (req, res, next) => {
  try {
    const dest = await travelGuideService.getDestinationBySlug(req.params.slug, true);
    if (!dest) return res.status(404).json({ status: 'error', message: 'Destination not found' });
    res.json({ status: 'success', data: dest });
  } catch (err) {
    next(err);
  }
});

travelGuidePublicRoutes.get('/articles', async (req, res, next) => {
  try {
    const articles = await travelGuideService.getArticles(true, req.query.destinationId);
    res.json({ status: 'success', data: articles });
  } catch (err) {
    next(err);
  }
});

travelGuidePublicRoutes.get('/articles/:slug', async (req, res, next) => {
  try {
    const article = await travelGuideService.getArticleBySlug(req.params.slug, true);
    if (!article) return res.status(404).json({ status: 'error', message: 'Article not found' });
    res.json({ status: 'success', data: article });
  } catch (err) {
    next(err);
  }
});
