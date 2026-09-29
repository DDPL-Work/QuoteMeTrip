import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { travelGuideService } from './travel-guide.service.js';
import { logAudit } from '../audit/audit.service.js';

export const travelGuideAdminRoutes = Router();

travelGuideAdminRoutes.use(authenticate);
travelGuideAdminRoutes.use(authorize('admin'));

// Regions
travelGuideAdminRoutes.get('/regions', async (req, res, next) => {
  try {
    const regions = await travelGuideService.getRegions(false);
    res.json({ status: 'success', data: regions });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.post('/regions', async (req, res, next) => {
  try {
    const region = await travelGuideService.createRegion(req.body);
    await logAudit({
      actorUserId: req.user.id,
      action: 'region.created',
      entityType: 'TravelGuideRegion',
      entityId: region.id,
      afterState: region,
    });
    res.status(201).json({ status: 'success', data: region });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.patch('/regions/:id', async (req, res, next) => {
  try {
    const oldRegion = await travelGuideService
      .getRegions()
      .then((r) => r.find((x) => x.id === parseInt(req.params.id)));
    const region = await travelGuideService.updateRegion(req.params.id, req.body);
    if (!region) return res.status(404).json({ status: 'error', message: 'Not found' });
    await logAudit({
      actorUserId: req.user.id,
      action: 'region.updated',
      entityType: 'TravelGuideRegion',
      entityId: region.id,
      beforeState: oldRegion,
      afterState: region,
    });
    res.json({ status: 'success', data: region });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.delete('/regions/:id', async (req, res, next) => {
  try {
    const success = await travelGuideService.deleteRegion(req.params.id);
    if (!success) return res.status(404).json({ status: 'error', message: 'Not found' });
    await logAudit({
      actorUserId: req.user.id,
      action: 'region.deleted',
      entityType: 'TravelGuideRegion',
      entityId: req.params.id,
    });
    res.json({ status: 'success', message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

// Destinations
travelGuideAdminRoutes.get('/destinations', async (req, res, next) => {
  try {
    const dests = await travelGuideService.getDestinations(false);
    res.json({ status: 'success', data: dests });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.post('/destinations', async (req, res, next) => {
  try {
    const dest = await travelGuideService.createDestination(req.body);
    await logAudit({
      actorUserId: req.user.id,
      action: 'destination.created',
      entityType: 'TravelGuideDestination',
      entityId: dest.id,
      afterState: dest,
    });
    res.status(201).json({ status: 'success', data: dest });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.patch('/destinations/:id', async (req, res, next) => {
  try {
    const oldDest = await travelGuideService
      .getDestinations()
      .then((r) => r.find((x) => x.id === parseInt(req.params.id)));
    const dest = await travelGuideService.updateDestination(req.params.id, req.body);
    if (!dest) return res.status(404).json({ status: 'error', message: 'Not found' });
    await logAudit({
      actorUserId: req.user.id,
      action: 'destination.updated',
      entityType: 'TravelGuideDestination',
      entityId: dest.id,
      beforeState: oldDest,
      afterState: dest,
    });
    res.json({ status: 'success', data: dest });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.delete('/destinations/:id', async (req, res, next) => {
  try {
    const success = await travelGuideService.deleteDestination(req.params.id);
    if (!success) return res.status(404).json({ status: 'error', message: 'Not found' });
    await logAudit({
      actorUserId: req.user.id,
      action: 'destination.deleted',
      entityType: 'TravelGuideDestination',
      entityId: req.params.id,
    });
    res.json({ status: 'success', message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

// Articles
travelGuideAdminRoutes.get('/articles', async (req, res, next) => {
  try {
    const articles = await travelGuideService.getArticles(false);
    res.json({ status: 'success', data: articles });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.post('/articles', async (req, res, next) => {
  try {
    const article = await travelGuideService.createArticle(req.body, req.user.id);
    await logAudit({
      actorUserId: req.user.id,
      action: 'article.created',
      entityType: 'TravelGuideArticle',
      entityId: article.id,
      afterState: article,
    });
    res.status(201).json({ status: 'success', data: article });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.get('/articles/:id', async (req, res, next) => {
  try {
    const article = await travelGuideService.getArticleById(req.params.id);
    if (!article) return res.status(404).json({ status: 'error', message: 'Not found' });
    res.json({ status: 'success', data: article });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.patch('/articles/:id', async (req, res, next) => {
  try {
    const oldArticle = await travelGuideService.getArticleById(req.params.id);
    const article = await travelGuideService.updateArticle(req.params.id, req.body);
    if (!article) return res.status(404).json({ status: 'error', message: 'Not found' });
    await logAudit({
      actorUserId: req.user.id,
      action: 'article.updated',
      entityType: 'TravelGuideArticle',
      entityId: article.id,
      beforeState: oldArticle,
      afterState: article,
    });
    res.json({ status: 'success', data: article });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.post('/articles/:id/publish', async (req, res, next) => {
  try {
    const article = await travelGuideService.publishArticle(req.params.id);
    if (!article) return res.status(404).json({ status: 'error', message: 'Not found' });
    await logAudit({
      actorUserId: req.user.id,
      action: 'article.published',
      entityType: 'TravelGuideArticle',
      entityId: article.id,
      afterState: article,
    });
    res.json({ status: 'success', data: article });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.post('/articles/:id/unpublish', async (req, res, next) => {
  try {
    const article = await travelGuideService.unpublishArticle(req.params.id);
    if (!article) return res.status(404).json({ status: 'error', message: 'Not found' });
    await logAudit({
      actorUserId: req.user.id,
      action: 'article.unpublished',
      entityType: 'TravelGuideArticle',
      entityId: article.id,
      afterState: article,
    });
    res.json({ status: 'success', data: article });
  } catch (err) {
    next(err);
  }
});

travelGuideAdminRoutes.delete('/articles/:id', async (req, res, next) => {
  try {
    const success = await travelGuideService.deleteArticle(req.params.id);
    if (!success) return res.status(404).json({ status: 'error', message: 'Not found' });
    await logAudit({
      actorUserId: req.user.id,
      action: 'article.deleted',
      entityType: 'TravelGuideArticle',
      entityId: req.params.id,
    });
    res.json({ status: 'success', message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});
