import { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import { jobApi } from '../lib/api.js';

export function JobRatingSection({ jobId }) {
  const [rating, setRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await jobApi.getRating(jobId);
        if (!cancelled && res?.rating) {
          setRating(res.rating);
        }
      } catch {
        // No rating yet
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function handleSelectRating(value) {
    if (rating || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await jobApi.submitRating(jobId, value);
      setRating(res?.rating ?? value);
    } catch (err) {
      setError(err?.message ?? 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="tf-card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
      <h3
        style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          margin: '0 0 0.5rem',
          color: 'var(--tf-text)',
        }}
      >
        {rating ? 'Your Rating' : 'Rate Your Experience'}
      </h3>
      <p style={{ color: 'var(--tf-text-muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
        {rating
          ? 'Thank you! Your feedback helps other travellers make informed decisions.'
          : 'Please select a rating from 1 to 5 stars for your completed trip.'}
      </p>

      {error && (
        <p className="tf-error" role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        aria-label="Star Rating"
        role="group"
      >
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = rating ? starValue <= rating : starValue <= (hoverRating || 0);
          return (
            <button
              key={starValue}
              type="button"
              disabled={!!rating || submitting}
              onClick={() => handleSelectRating(starValue)}
              onMouseEnter={() => !rating && setHoverRating(starValue)}
              onMouseLeave={() => !rating && setHoverRating(0)}
              aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: rating ? 'default' : 'pointer',
                padding: '0.2rem',
                color: isFilled ? '#f5c518' : '#dce3dc',
                transition: 'color 0.15s ease, transform 0.15s ease',
                transform: !rating && hoverRating === starValue ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              <FiStar
                style={{
                  fontSize: '1.75rem',
                  fill: isFilled ? '#f5c518' : 'transparent',
                  stroke: isFilled ? '#c99e0a' : 'currentColor',
                  strokeWidth: 2,
                }}
              />
            </button>
          );
        })}
        {rating && (
          <span
            style={{
              marginLeft: '0.75rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#7a5c06',
            }}
          >
            {rating} / 5 Stars (
            {rating === 5 ? 'Excellent' : rating >= 4 ? 'Great' : rating >= 3 ? 'Good' : 'Fair'})
          </span>
        )}
      </div>
    </div>
  );
}
