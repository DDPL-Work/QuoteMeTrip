import sanitizeHtml from 'sanitize-html';
import {
  TravelGuideRegion,
  TravelGuideDestination,
  TravelGuideArticle,
} from '../../db/models/index.js';
import { Op } from 'sequelize';

const SANITIZE_OPTIONS = {
  allowedTags: [
    'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'b', 'i', 'strong', 'em', 'strike', 's',
    'u', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'hr', 'br',
    'img', 'figure', 'figcaption', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'data-align', 'data-caption', 'class', 'style'],
    figure: ['class', 'style', 'data-align'],
    figcaption: ['class', 'style'],
    p: ['class', 'style'],
    div: ['class', 'style'],
    span: ['class', 'style'],
    th: ['colspan', 'rowspan', 'style'],
    td: ['colspan', 'rowspan', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'data'],
  transformTags: {
    a: (tagName, attribs) => {
      const newAttribs = { ...attribs };
      if (newAttribs.href && !newAttribs.href.startsWith('/')) {
        newAttribs.target = '_blank';
        newAttribs.rel = 'noopener noreferrer';
      }
      return { tagName: 'a', attribs: newAttribs };
    },
  },
};

export const sanitizeArticleContent = (content) => {
  if (!content || typeof content !== 'string') return content;
  return sanitizeHtml(content, SANITIZE_OPTIONS);
};

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
        ['id', 'DESC'],
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
    const payload = { ...data, authorId };
    if (payload.content) {
      payload.content = sanitizeArticleContent(payload.content);
    }
    return await TravelGuideArticle.create(payload);
  }

  async updateArticle(id, data) {
    const article = await TravelGuideArticle.findByPk(id);
    if (!article) return null;
    const payload = { ...data };
    if (payload.content !== undefined) {
      payload.content = sanitizeArticleContent(payload.content);
    }
    return await article.update(payload);
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
