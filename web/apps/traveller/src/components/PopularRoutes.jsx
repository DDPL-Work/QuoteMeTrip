import React from 'react';
import { useNavigate } from 'react-router-dom';

export const DEFAULT_POPULAR_ROUTES = [
  {
    id: '1',
    kind: 'city',
    name: 'Istanbul',
    country: 'Türkiye',
    tagline: 'Two continents, one city',
    image: '/images/route1.avif',
  },
  {
    id: '2',
    kind: 'balloons',
    name: 'Cappadocia',
    country: 'Türkiye',
    tagline: 'Balloons at sunrise',
    image: '/images/route2.avif',
  },
  {
    id: '3',
    kind: 'coast',
    name: 'Bodrum',
    country: 'Türkiye',
    tagline: 'Blue coast and history',
    image: '/images/route3.avif',
  },
  {
    id: '4',
    kind: 'coast',
    name: 'Bodrum',
    country: 'Türkiye',
    tagline: 'Blue Cruise',
    image: '/images/route4.avif',
  },
  {
    id: '5',
    kind: 'city',
    name: 'Istanbul',
    country: 'Türkiye',
    tagline: 'Bosphorus cruise',
    image: '/images/route5.avif',
  },
  {
    id: '6',
    kind: 'mountains',
    name: 'Fethiye',
    country: 'Türkiye',
    tagline: 'Mountains meet the sea',
    image: '/images/route6.avif',
  },
];

/**
 * PopularRoutes Component
 * Renders the popular travel routes section with high-res route images
 * from /images/ (route1.avif through route6.avif, with route.png fallback).
 */
export function PopularRoutes({
  routes = DEFAULT_POPULAR_ROUTES,
  title = 'Popular routes',
  subtitle = 'Where travellers are planning their next trip.',
  onSelectRoute,
  onViewAll,
}) {
  const navigate = useNavigate();

  const handleRouteClick = (route) => {
    if (onSelectRoute) {
      onSelectRoute(route);
    } else {
      navigate(`/plan-trip?destination=${encodeURIComponent(route.name)}`);
    }
  };

  const handleViewAllClick = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/destinations');
    }
  };

  return (
    <section className="g-sec" id="g-routes">
      <div className="g-wrap">
        <div className="g-hd">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="g-more" type="button" onClick={handleViewAllClick}>
            View all routes →
          </button>
        </div>
        <div className="g-routes">
          {routes.map((route, i) => (
            <button
              className="g-route"
              key={route.id || i}
              type="button"
              aria-label={`Plan a trip to ${route.name} - ${route.tagline || route.country}`}
              onClick={() => handleRouteClick(route)}
            >
              <img
                src={route.image || `/images/route${(i % 6) + 1}.avif`}
                alt={route.name}
                onError={(e) => {
                  e.currentTarget.src = '/images/route.png';
                }}
              />
              <span className="t">
                <b>{route.name}</b>
                <br />
                <span>{route.tagline || route.country}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PopularRoutes;
