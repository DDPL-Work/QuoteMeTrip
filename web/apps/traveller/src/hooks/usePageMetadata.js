import { useEffect } from 'react';

/**
 * usePageMetadata Hook
 * Sets document.title and updates meta description tag.
 */
export function usePageMetadata(title, description) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | QuoteMeTrip`;
    }

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);
}
