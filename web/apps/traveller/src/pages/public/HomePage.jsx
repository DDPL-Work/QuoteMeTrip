import { useState } from 'react';
import { useI18n } from '@troublefree/i18n';
import { useAuth } from '../../features/auth/auth-context.js';
import { PopularRoutes } from '../../components/PopularRoutes.jsx';
import './HomePage.css';

// Icon paths extracted from the reference HTML (quotemetrip-traveller (4) (3).html)
const ICON_PATHS = {
  bag: 'M3 10h18M5 10V20h14V10M9 20v-6h6v6M12 3 3 10h18Z',
  inbox: 'M3 20V8h18v12M3 13h18M7 8V5h10v3',
  map: 'M5 17h14M4 17l1.5-6h13L20 17M7 17v2M17 17v2M7 11l1-4h8l1 4',
  pin: 'M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  cal: 'M3 4h18v18H3ZM16 2v4M8 2v4M3 10h18',
  clock: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2ZM12 6v6l4 2',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  free: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  scale: 'M16 22H8M12 2v20M20 6H4l4 8H8l4 8 4-8h0L20 6Z',
  card: 'M2 5h20v14H2ZM2 10h20',
  head: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  list: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z',
};

const ic = (name, size = 18) => {
  const d = ICON_PATHS[name] || ICON_PATHS.shield;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
};

// Map route names to illustration kinds
const ROUTE_KINDS = {
  Istanbul: 'city',
  Cappadocia: 'balloons',
  Santorini: 'coast',
  Bodrum: 'coast',
  Fethiye: 'mountains',
  Cairo: 'pyramids',
  Kazbegi: 'mountains',
};

export function PublicHomePage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const COUNTRIES = ['Türkiye', 'Italy', 'Greece'];
  const [trip, setTrip] = useState({
    country: 'Türkiye',
    days: [{ date: '' }],
    travellers: 2,
    flexible: false,
    suggest: false,
  });
  const [scope, setScope] = useState('Full package');

  const planTripHref = user ? '/plan-trip' : '/login?redirect=/plan-trip';

  return (
    <div className="g">
      {/* 1. HERO SECTION */}
      <section className="g-hero">
        <img src="/images/hero.avif" alt="" aria-hidden="true" />
        <div className="g-wrap">
          <div className="g-eyebrow">Day-by-day holidays · local agencies</div>
          <h1>
            One request.<span>Multiple travel quotes.</span>
          </h1>
          <p className="lead">
            Plan each day of your trip — dates, destinations, hotels, guides and activities.
            Verified agencies in that country send you their offers to compare.
          </p>
          <form
            className="g-search"
            aria-label="Create a travel request"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = planTripHref;
            }}
          >
            <div className="g-tabs" role="group" aria-label="What do you need?">
              {[
                ['Full package', 'bag'],
                ['Hotel only', 'inbox'],
                ['Vehicle + driver', 'map'],
                ['Guide & activities', 'pin'],
              ].map(([n, k]) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={n === scope}
                  onClick={() => setScope(n)}
                >
                  {ic(k, 17)} {n}
                </button>
              ))}
            </div>
            <div className="g-fields">
              <div className="g-f">
                {ic('pin')}
                <label style={{ width: '100%' }}>
                  Where are you going?
                  <select
                    value={trip.country}
                    onChange={(e) => setTrip({ ...trip, country: e.target.value })}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="g-f">
                {ic('cal')}
                <label style={{ width: '100%' }}>
                  First day
                  <input
                    type="date"
                    value={trip.days[0]?.date || ''}
                    onChange={(e) => setTrip({ ...trip, days: [{ date: e.target.value }] })}
                  />
                </label>
              </div>
              <div className="g-f">
                {ic('clock')}
                <label style={{ width: '100%' }}>
                  How many days?
                  <input type="number" min="1" max="30" defaultValue="7" />
                </label>
              </div>
              <div className="g-f">
                {ic('users')}
                <label style={{ width: '100%' }}>
                  Travellers
                  <input
                    type="number"
                    min="1"
                    value={trip.travellers}
                    onChange={(e) => setTrip({ ...trip, travellers: e.target.value })}
                  />
                </label>
              </div>
              <button className="g-go" type="submit">
                Get free quotes →
              </button>
            </div>
            <div className="g-sub">
              <div className="row" style={{ gap: '18px', flexWrap: 'wrap' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={trip.flexible}
                    onChange={(e) => setTrip({ ...trip, flexible: e.target.checked })}
                  />
                  My dates are flexible
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={trip.suggest}
                    onChange={(e) => setTrip({ ...trip, suggest: e.target.checked })}
                  />
                  Let agencies suggest the route
                </label>
              </div>
              <a href="#g-how">How does it work?</a>
            </div>
          </form>
        </div>
      </section>

      {/* 2. TRUST SECTION */}
      <div className="g-trust">
        <div className="g-wrap">
          {[
            ['shield', 'Verified agencies', 'Documents checked by our team'],
            ['free', 'Free request', 'No fee for travellers'],
            ['scale', 'Compare offers', 'Price, inclusions, ratings'],
            ['card', 'Pay the agency directly', 'On the agency’s own terms'],
            ['head', 'Support', 'We step in if needed'],
          ].map(([k, b, s]) => (
            <div className="i" key={k}>
              <span className="ic">{ic(k)}</span>
              <p style={{ margin: 0 }}>
                <b>{b}</b>
                <br />
                <span>{s}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. POPULAR ROUTES */}
      <PopularRoutes />

      {/* 4. HOW IT WORKS */}
      <section className="g-sec" id="g-how">
        <div className="g-wrap">
          <div className="g-hd">
            <div>
              <h2>How Troublefree Holiday works</h2>
              <p>
                Three steps from a rough idea to a confirmed, paid-for trip — with no booking fees.
              </p>
            </div>
            <button className="g-more">Start step 1 →</button>
          </div>
          <div className="g-steps3">
            <article className="g-stepcard">
              <div className="art">
                <svg viewBox="0 0 400 200" fill="#E5F2EA">
                  <rect width="400" height="200" />
                </svg>
              </div>
              <div className="b">
                <span className="sn">STEP 1 · 5 MINUTES</span>
                <h3>Build your itinerary, day by day</h3>
                <p>
                  Pick the country, then give every day a date and a destination. Say what you need
                  on each day — or leave it open and let the agency plan it.
                </p>
                <ul className="ticks">
                  <li>Add, remove and reorder days as you like</li>
                  <li>Per day: activity, guide, hotel and hotel class</li>
                  <li>Travellers, luggage and any special requests</li>
                  <li>Your name, email and WhatsApp come from your profile</li>
                </ul>
                <div className="tipbox">
                  Not sure of the route? Tick “let agencies suggest the route” and they will propose
                  one.
                </div>
                <button className="g-btn d">Build my itinerary</button>
              </div>
            </article>

            <article className="g-stepcard">
              <div className="art">
                <svg viewBox="0 0 400 200" fill="#E5F2EA">
                  <rect width="400" height="200" />
                </svg>
              </div>
              <div className="b">
                <span className="sn">STEP 2 · 24–48 HOURS</span>
                <h3>Receive quotes from local agencies</h3>
                <p>
                  Your itinerary goes only to verified agencies in that country. They reply with a
                  full price and exactly what it includes.
                </p>
                <ul className="ticks">
                  <li>Compare price, inclusions and star rating side by side</li>
                  <li>Ask questions in chat — contact details stay hidden</li>
                  <li>Change your plan any time; every agency gets the new version</li>
                  <li>Old quotes are marked outdated so you never compare the wrong one</li>
                </ul>
                <div className="tipbox">
                  Free for travellers. Agencies pay Troublefree Holiday, never you.
                </div>
                <button className="g-btn d">See my quotes</button>
              </div>
            </article>

            <article className="g-stepcard">
              <div className="art">
                <svg viewBox="0 0 400 200" fill="#E5F2EA">
                  <rect width="400" height="200" />
                </svg>
              </div>
              <div className="b">
                <span className="sn">STEP 3 · SAME DAY</span>
                <h3>Agree, pay the agency, get confirmed</h3>
                <p>
                  Accept the quote you like. The agency sends a payment link and you pay them
                  directly — Troublefree Holiday never touches your money.
                </p>
                <ul className="ticks">
                  <li>Agreeing closes quoting and locks your price</li>
                  <li>Tick “deposit paid” with the amount and reference</li>
                  <li>Contacts unlock for both sides straight away</li>
                  <li>You get a written confirmation with a Print / PDF copy</li>
                </ul>
                <div className="tipbox">
                  After the trip you rate the agency from 1 to 5 stars, which helps the next
                  traveller.
                </div>
                <button className="g-btn d">See the booking steps</button>
              </div>
            </article>
          </div>

          <div className="g-photoband">
            <img src="/images/how.png" alt="How it works — every day planned, every quote compared" />
            <div className="cap">
              <b>Every day planned. Every quote compared.</b>
              <span>Real itineraries, priced by agencies who live there.</span>
            </div>
          </div>

          <div className="g-journey">
            <div className="jt">Your trip status, from start to finish</div>
            <ol>
              {[
                ['Draft', 'You are still planning'],
                ['Sent', 'Agencies in your country notified'],
                ['Quotes received', 'Compare the offers'],
                ['Agreed', 'Price locked, quoting closed'],
                ['Deposit paid', 'Contacts unlocked'],
                ['Confirmed', 'Written confirmation + PDF'],
              ].map(([t, d], i) => (
                <li key={i}>
                  <span className="n">{i + 1}</span>
                  <b>{t}</b>
                  <span>{d}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 5. TRAVEL GUIDE & AGENCIES */}
      <section className="g-sec">
        <div className="g-wrap">
          <div className="g-hd">
            <div>
              <h2>With you while you plan</h2>
              <p>Simple guides for a trouble-free trip.</p>
            </div>
          </div>
          <div className="g-help">
            {[
              [
                'list',
                'How to plan day by day',
                'Set dates and stops first, then add hotels, guides and activities per day.',
              ],
              [
                'scale',
                'Comparing quotes properly',
                'Look at what is included — hotels, vehicle, guide — not just the total price.',
              ],

              [
                'card',
                'Paying the agency safely',
                'Use the agency’s payment link or bank transfer and keep your receipt.',
              ],
            ].map(([k, b, s]) => (
              <a
                href="#guide"
                className="g-tip"
                style={{ textDecoration: 'none', color: 'inherit' }}
                key={k}
              >
                <span className="ic">{ic(k)}</span>
                <b>{b}</b>
                <span>{s}</span>
                <span style={{ color: '#147D33', fontWeight: '600', fontSize: '13.5px' }}>
                  Read guide →
                </span>
              </a>
            ))}
            <div className="g-agc">
              <span
                style={{
                  color: '#FC7C00',
                  fontWeight: '700',
                  fontSize: '12px',
                  letterSpacing: '.12em',
                }}
              >
                FOR TRAVEL AGENCIES
              </span>
              <b>Receive travel requests for your country</b>
              <span>
                Choose a fixed membership or pay a commission per confirmed booking. Manage
                everything in the Agency app.
              </span>
              <button className="g-btn p" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                Become a partner agency
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="g-sec" id="g-faq">
        <div className="g-wrap">
          <div className="g-hd">
            <div>
              <h2>Frequently asked questions</h2>
              <p>Everything you need to know before you start.</p>
            </div>
          </div>
          <div className="g-faq">
            {[
              [
                [
                  'Is sending a request free?',
                  'Yes. Creating an itinerary, receiving quotes and comparing them is free for travellers.',
                ],
                [
                  'Which agencies receive my itinerary?',
                  'Only verified agencies operating in the country you choose.',
                ],
                [
                  'Can I edit my itinerary after sending?',
                  'Yes, until you agree to a quote. The new version is sent to all agencies again.',
                ],
              ],
              [
                [
                  'How do I pay for my holiday?',
                  'Directly to the agency — through their payment link, bank transfer or cash.',
                ],
                [
                  'When are contact details shared?',
                  'After you agree to a quote and confirm the deposit is paid.',
                ],
                [
                  'Can I print my itinerary?',
                  'Yes. Every itinerary and confirmation can be printed or saved as PDF.',
                ],
              ],
            ].map((c, i) => (
              <div key={i}>
                {c.map(([q, a]) => (
                  <details key={q}>
                    <summary>{q}</summary>
                    <p>{a}</p>
                  </details>
                ))}
              </div>
            ))}
            <div className="g-sup">
              <span
                className="ic"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#fff',
                  color: '#147D33',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ic('chat', 22)}
              </span>
              <b style={{ fontSize: '16px' }}>Need help?</b>
              <span style={{ color: '#56625B', fontSize: '14px' }}>
                Our team answers in English and Turkish.
              </span>
              <button className="g-btn g" type="button" style={{ alignSelf: 'flex-start' }}>
                Contact us
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
