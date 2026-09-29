import {
  TravelGuideRegion,
  TravelGuideDestination,
  TravelGuideArticle,
} from '../../db/models/index.js';
import { Op } from 'sequelize';

export class TravelGuideService {
  // REGIONS
  async getRegions(onlyPublished = false) {
    const where = onlyPublished ? { status: 'published' } : {};
    return await TravelGuideRegion.findAll({ where, order: [['sortOrder', 'ASC']] });
  }

  async createRegion(data) {
    return await TravelGuideRegion.create(data);
  }

  async updateRegion(id, data) {
    const region = await TravelGuideRegion.findByPk(id);
    if (!region) return null;
    return await region.update(data);
  }

  async deleteRegion(id) {
    const region = await TravelGuideRegion.findByPk(id);
    if (!region) return false;
    await region.destroy();
    return true;
  }

  // DESTINATIONS
  async getDestinations(onlyPublished = false, regionId = null) {
    const where = onlyPublished ? { status: 'published' } : {};
    if (regionId) where.regionId = regionId;
    return await TravelGuideDestination.findAll({ where, order: [['sortOrder', 'ASC']] });
  }

  async getDestinationBySlug(slug, onlyPublished = true) {
    const where = { slug };
    if (onlyPublished) where.status = 'published';
    return await TravelGuideDestination.findOne({ where });
  }

  async createDestination(data) {
    return await TravelGuideDestination.create(data);
  }

  async updateDestination(id, data) {
    const dest = await TravelGuideDestination.findByPk(id);
    if (!dest) return null;
    return await dest.update(data);
  }

  async deleteDestination(id) {
    const dest = await TravelGuideDestination.findByPk(id);
    if (!dest) return false;
    await dest.destroy();
    return true;
  }

  // ARTICLES
  async getArticles(onlyPublished = false, destinationId = null) {
    const where = onlyPublished ? { status: 'published' } : {};
    if (destinationId) where.destinationId = destinationId;
    return await TravelGuideArticle.findAll({
      where,
      order: [
        ['publishedAt', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  async getArticleById(id) {
    return await TravelGuideArticle.findByPk(id);
  }

  async getArticleBySlug(slug, onlyPublished = true) {
    const where = { slug };
    if (onlyPublished) where.status = 'published';
    return await TravelGuideArticle.findOne({ where });
  }

  async createArticle(data, authorId) {
    return await TravelGuideArticle.create({ ...data, authorId });
  }

  async updateArticle(id, data) {
    const article = await TravelGuideArticle.findByPk(id);
    if (!article) return null;
    return await article.update(data);
  }

  async publishArticle(id) {
    const article = await TravelGuideArticle.findByPk(id);
    if (!article) return null;
    return await article.update({ status: 'published', publishedAt: new Date() });
  }

  async unpublishArticle(id) {
    const article = await TravelGuideArticle.findByPk(id);
    if (!article) return null;
    return await article.update({ status: 'draft' });
  }

  async deleteArticle(id) {
    const article = await TravelGuideArticle.findByPk(id);
    if (!article) return false;
    await article.destroy();
    return true;
  }
}

export const travelGuideService = new TravelGuideService();
