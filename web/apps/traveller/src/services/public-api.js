/**
 * Centralized Public API Service for Troublefree Holiday.
 *
 * Provides structured abstractions for public destinations, travel guides,
 * and agency profiles. Uses live API calls where available, falling back to
 * controlled local mock repositories.
 */

import { MOCK_DESTINATIONS, MOCK_GUIDES, MOCK_AGENCIES } from '../data/public-data.js';
import { travelGuideApi } from '../lib/api.js';

export async function getDestinations({ search = '', region = '' } = {}) {
  try {
    const liveData = await travelGuideApi.getDestinations({ region });
    if (Array.isArray(liveData) && liveData.length > 0) {
      let results = liveData;
      const query = search.toLowerCase().trim();
      if (query) {
        results = results.filter(
          (d) =>
            d.name?.toLowerCase().includes(query) ||
            d.region?.toLowerCase().includes(query) ||
            d.description?.toLowerCase().includes(query),
        );
      }
      return results;
    }
  } catch (err) {
    // Graceful fallback to static repository
  }

  const query = search.toLowerCase().trim();
  const reg = region.toLowerCase().trim();

  let results = MOCK_DESTINATIONS;
  if (query) {
    results = results.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.region.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query),
    );
  }
  if (reg && reg !== 'all') {
    results = results.filter((d) => d.region.toLowerCase() === reg);
  }
  return results;
}

export async function getDestinationBySlug(slug) {
  try {
    const liveItem = await travelGuideApi.getDestinationBySlug(slug);
    if (liveItem) {
      const articles = await travelGuideApi.getArticles().catch(() => []);
      const related = Array.isArray(articles)
        ? articles.filter((a) => a.destinationId === liveItem.id)
        : [];
      return { destination: liveItem, relatedGuides: related };
    }
  } catch (err) {
    // Fallback to static
  }

  const item = MOCK_DESTINATIONS.find((d) => d.slug === slug);
  if (!item) {
    const error = new Error(`Destination '${slug}' not found.`);
    error.status = 404;
    throw error;
  }
  const relatedGuides = MOCK_GUIDES.filter((g) => g.destinationSlug === slug);
  return { destination: item, relatedGuides };
}

export async function getTravelGuides({ search = '', category = '' } = {}) {
  try {
    const liveArticles = await travelGuideApi.getArticles();
    if (Array.isArray(liveArticles) && liveArticles.length > 0) {
      let results = liveArticles;
      const query = search.toLowerCase().trim();
      if (query) {
        results = results.filter(
          (g) =>
            g.title?.toLowerCase().includes(query) ||
            g.summary?.toLowerCase().includes(query) ||
            g.category?.toLowerCase().includes(query),
        );
      }
      return results;
    }
  } catch (err) {
    // Graceful fallback
  }

  const query = search.toLowerCase().trim();
  const cat = category.toLowerCase().trim();

  let results = MOCK_GUIDES;
  if (query) {
    results = results.filter(
      (g) =>
        g.title.toLowerCase().includes(query) ||
        g.summary.toLowerCase().includes(query) ||
        g.category.toLowerCase().includes(query),
    );
  }
  if (cat && cat !== 'all') {
    results = results.filter((g) => g.category.toLowerCase() === cat);
  }
  return results;
}

export async function getTravelGuideBySlug(slug) {
  try {
    const liveArticle = await travelGuideApi.getArticleBySlug(slug);
    if (liveArticle) {
      const articles = await travelGuideApi.getArticles().catch(() => []);
      const related = Array.isArray(articles)
        ? articles.filter((a) => a.slug !== slug).slice(0, 2)
        : [];
      return { guide: liveArticle, relatedGuides: related };
    }
  } catch (err) {
    // Fallback
  }

  const item = MOCK_GUIDES.find((g) => g.slug === slug);
  if (!item) {
    const error = new Error(`Travel guide '${slug}' not found.`);
    error.status = 404;
    throw error;
  }
  const related = MOCK_GUIDES.filter((g) => g.slug !== slug).slice(0, 2);
  return { guide: item, relatedGuides: related };
}

export async function getAgencies({ search = '', city = '' } = {}) {
  const query = search.toLowerCase().trim();
  const c = city.toLowerCase().trim();

  let results = MOCK_AGENCIES;
  if (query) {
    results = results.filter(
      (a) =>
        a.agencyName.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query) ||
        a.bio.toLowerCase().includes(query),
    );
  }
  if (c && c !== 'all') {
    results = results.filter((a) => a.city.toLowerCase() === c);
  }
  return results;
}

export async function getAgencyById(id) {
  const item = MOCK_AGENCIES.find((a) => String(a.id) === String(id));
  if (!item) {
    const error = new Error(`Agency #${id} not found.`);
    error.status = 404;
    throw error;
  }
  // Guarantee NO private contact info is exposed publicly
  const { agencyName, city, country, bio, specialties, languages, verified } = item;
  return {
    agency: {
      id: item.id,
      agencyName,
      city,
      country,
      bio,
      specialties,
      languages,
      verified,
    },
  };
}

export async function submitContactForm(input) {
  if (!input.name || !input.email || !input.message) {
    throw new Error('Name, email, and message are required.');
  }
  // Clean mock submission state
  return { success: true, message: 'Your message has been submitted.' };
}
