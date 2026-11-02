import { useEffect } from 'react';

/**
 * usePageMetadata Hook
 * Sets document.title and updates meta description tag.
 */
export function usePageMetadata(title, description, options = {}) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | QuoteMeTrip`;
    }

    const setMetaTag = (attrName, attrVal, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (description) {
      setMetaTag('name', 'description', description);
    }

    if (options.canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', options.canonicalUrl);
    }

    if (options.robots) {
      setMetaTag('name', 'robots', options.robots);
    }

    // OpenGraph
    setMetaTag('property', 'og:title', options.ogTitle || title);
    setMetaTag('property', 'og:description', options.ogDescription || description);
    if (options.ogImage) {
      setMetaTag('property', 'og:image', options.ogImage);
    }

    // Twitter
    setMetaTag('name', 'twitter:card', options.twitterCard || 'summary_large_image');
    setMetaTag('name', 'twitter:title', options.ogTitle || title);
    setMetaTag('name', 'twitter:description', options.ogDescription || description);
    if (options.ogImage) {
      setMetaTag('name', 'twitter:image', options.ogImage);
    }

    // JSON-LD Structured Data
    if (options.jsonLd) {
      let script = document.querySelector('script[type="application/ld+json"]#qmt-structured-data');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('id', 'qmt-structured-data');
        document.head.appendChild(script);
      }
      try {
        script.textContent = JSON.stringify(options.jsonLd);
      } catch {
        // ignore serialization issue
      }
    }
  }, [title, description, options]);
}
