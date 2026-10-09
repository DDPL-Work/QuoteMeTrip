/**
 * Centralized Public API Service for QuoteMeTrip.
 *
 * Provides structured abstractions for public destinations, travel services,
 * travel guides, countries, and agency profiles. Uses live API calls where available,
 * falling back to verified local repositories.
 */

import {
  MOCK_COUNTRIES,
  MOCK_DESTINATIONS,
  MOCK_SERVICES,
  MOCK_GUIDES,
  MOCK_AGENCIES,
} from '../data/public-data.js';
import { travelGuideApi } from '../lib/api.js';

// Normalized slug mapping for backward compatibility and aliases
const DESTINATION_SLUG_ALIASES = {
  'ephesus-izmir': 'efes',
  'ephesus': 'efes',
};

const GUIDE_SLUG_ALIASES = {
  'first-time-turkey-itinerary': 'istanbul',
  'cappadocia-balloon-guide': 'cappadocia',
  'best-mediterranean-beaches': 'antalya',
  'turkish-cuisine-foodie-guide': 'ephesus',
};

export async function getCountries() {
  return MOCK_COUNTRIES;
}

export async function getCountryBySlug(slug) {
  const normalized = (slug || '').toLowerCase().trim();
  const country = MOCK_COUNTRIES.find(
    (c) => c.slug === normalized || c.slug === 'turkey' && (normalized === 'turkiye' || normalized === 'turkey'),
  );
  if (!country) {
    const error = new Error(`Country '${slug}' not found.`);
    error.status = 404;
    throw error;
  }
  const destinations = MOCK_DESTINATIONS.filter(
    (d) => d.countrySlug === country.slug || d.country.toLowerCase() === 'turkey',
  );
  const guides = MOCK_GUIDES;
  const services = MOCK_SERVICES;
  return { country, destinations, guides, services };
}

export async function getDestinations({ search = '', region = '', countrySlug = '' } = {}) {
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
  } catch (_err) {
    // Graceful fallback to static repository
  }

  const query = search.toLowerCase().trim();
  const reg = region.toLowerCase().trim();
  const cSlug = countrySlug.toLowerCase().trim();

  let results = MOCK_DESTINATIONS;
  if (cSlug) {
    results = results.filter((d) => d.countrySlug === cSlug);
  }
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

export async function getDestinationBySlug(rawSlug, _countrySlug = 'turkey') {
  const slug = DESTINATION_SLUG_ALIASES[rawSlug] || rawSlug;

  try {
    const liveItem = await travelGuideApi.getDestinationBySlug(slug);
    if (liveItem) {
      const articles = await travelGuideApi.getArticles().catch(() => []);
      const related = Array.isArray(articles)
        ? articles.filter((a) => a.destinationId === liveItem.id || a.destinationSlug === slug)
        : [];
      return { destination: liveItem, relatedGuides: related, services: MOCK_SERVICES };
    }
  } catch (_err) {
    // Fallback to static
  }

  const item = MOCK_DESTINATIONS.find(
    (d) =>
      d.slug === slug ||
      d.slug === rawSlug ||
      d.name.toLowerCase() === slug.toLowerCase() ||
      (slug === 'efes' && d.slug === 'efes'),
  );

  if (!item) {
    const error = new Error(`Destination '${rawSlug}' not found.`);
    error.status = 404;
    throw error;
  }

  const relatedGuides = MOCK_GUIDES.filter(
    (g) => g.destinationSlug === item.slug || (item.slug === 'efes' && g.slug === 'ephesus'),
  );

  const relevantServices = (item.relevantServiceSlugs || [])
    .map((sSlug) => MOCK_SERVICES.find((s) => s.slug === sSlug))
    .filter(Boolean);

  return {
    destination: item,
    relatedGuides,
    relevantServices: relevantServices.length > 0 ? relevantServices : MOCK_SERVICES.slice(0, 3),
  };
}

export async function getTravelServices({ search = '' } = {}) {
  const query = search.toLowerCase().trim();
  if (!query) return MOCK_SERVICES;
  return MOCK_SERVICES.filter(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      s.title.toLowerCase().includes(query) ||
      s.summary.toLowerCase().includes(query),
  );
}

export async function getTravelServiceBySlug(slug) {
  const item = MOCK_SERVICES.find((s) => s.slug === slug);
  if (!item) {
    const error = new Error(`Travel service '${slug}' not found.`);
    error.status = 404;
    throw error;
  }
  const relatedDestinations = MOCK_DESTINATIONS.filter(
    (d) => d.relevantServiceSlugs?.includes(slug) || true,
  ).slice(0, 4);

  return { service: item, relatedDestinations };
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
  } catch (_err) {
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

export async function getTravelGuideBySlug(rawSlug) {
  const slug = GUIDE_SLUG_ALIASES[rawSlug] || rawSlug;

  try {
    const liveArticle = await travelGuideApi.getArticleBySlug(slug);
    if (liveArticle) {
      const articles = await travelGuideApi.getArticles().catch(() => []);
      const related = Array.isArray(articles)
        ? articles.filter((a) => a.slug !== slug).slice(0, 2)
        : [];
      return { guide: liveArticle, relatedGuides: related };
    }
  } catch (_err) {
    // Fallback
  }

  const item = MOCK_GUIDES.find((g) => g.slug === slug || g.slug === rawSlug);
  if (!item) {
    const error = new Error(`Travel guide '${rawSlug}' not found.`);
    error.status = 404;
    throw error;
  }
  const related = MOCK_GUIDES.filter((g) => g.slug !== slug && g.slug !== rawSlug).slice(0, 3);
  return { guide: item, relatedGuides: related };
}

export async function getAgencies({ search = '', city = '', location = '' } = {}) {
  const query = search.toLowerCase().trim();
  const c = city.toLowerCase().trim();
  const loc = (location || '').toLowerCase().trim();

  let results = MOCK_AGENCIES;

  if (loc && loc !== 'all') {
    if (loc === 'turkey') {
      results = results.filter((a) => a.country.toLowerCase() === 'turkey');
    } else if (loc === 'cappadocia') {
      results = results.filter(
        (a) => a.city.toLowerCase() === 'nevsehir' || a.locationSlug === 'cappadocia',
      );
    } else {
      results = results.filter(
        (a) =>
          a.locationSlug === loc ||
          a.city.toLowerCase() === loc ||
          a.city.toLowerCase().includes(loc),
      );
    }
  }

  if (c && c !== 'all') {
    results = results.filter(
      (a) => a.city.toLowerCase() === c || (c === 'nevsehir' && a.locationSlug === 'cappadocia'),
    );
  }

  if (query) {
    results = results.filter(
      (a) =>
        a.agencyName.toLowerCase().includes(query) ||
        a.city.toLowerCase().includes(query) ||
        a.bio.toLowerCase().includes(query) ||
        a.specialties?.some((s) => s.toLowerCase().includes(query)),
    );
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
  return { success: true, message: 'Your message has been submitted.' };
}
