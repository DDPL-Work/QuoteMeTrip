/**
 * Controlled public dataset for Troublefree Holiday (Track B).
 *
 * Isolated mock repository for destinations, travel guides, and public agency
 * profiles. Prepared for seamless API replacement when backend CMS endpoints arrive.
 */

export const MOCK_DESTINATIONS = [
  {
    id: '1',
    slug: 'istanbul',
    name: 'Istanbul',
    region: 'Marmara',
    country: 'Turkey',
    tagline: 'Where East meets West across the historic Bosphorus',
    description:
      'Istanbul is a captivating metropolis straddling Europe and Asia. Explore world-renowned landmarks like the Hagia Sophia, Blue Mosque, Topkapi Palace, and Grand Bazaar, while enjoying vibrant cafes and Bosphorus cruises.',
    image:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
    popularPlaces: [
      'Hagia Sophia',
      'Bosphorus Cruise',
      'Grand Bazaar',
      'Topkapi Palace',
      'Galata Tower',
    ],
    bestTimeToVisit: 'April - May, September - November',
    featured: true,
  },
  {
    id: '2',
    slug: 'cappadocia',
    name: 'Cappadocia',
    region: 'Central Anatolia',
    country: 'Turkey',
    tagline: 'Fairy chimneys, hot air balloons, and underground cities',
    description:
      'Famous for its honeycomb hills, volcanic fairy chimneys, and cave dwellings. Rise at sunrise for an unforgettable hot air balloon flight over valleys carved by ancient erosions.',
    image:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=800&q=80',
    popularPlaces: [
      'Goreme Open Air Museum',
      'Love Valley',
      'Derinkuyu Underground City',
      'Uchisar Castle',
    ],
    bestTimeToVisit: 'April - June, September - October',
    featured: true,
  },
  {
    id: '3',
    slug: 'antalya',
    name: 'Antalya',
    region: 'Mediterranean',
    country: 'Turkey',
    tagline: 'The Turquoise Coast jewel with golden beaches and ancient ruins',
    description:
      'Nestled on the Mediterranean coast, Antalya combines turquoise waters with historic Kaleici old town, dramatic waterfalls, and nearby Greco-Roman amphitheaters.',
    image:
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    popularPlaces: ['Kaleici Old Town', 'Duden Waterfalls', 'Aspendos Theater', 'Kaputas Beach'],
    bestTimeToVisit: 'May - October',
    featured: true,
  },
  {
    id: '4',
    slug: 'bodrum',
    name: 'Bodrum',
    region: 'Aegean',
    country: 'Turkey',
    tagline: 'White-washed Aegean elegance, luxury yachts, and nightlife',
    description:
      'A glamorous Aegean resort town featuring white sugar-cube houses, the medieval Castle of St. Peter, crystal-clear bays, and world-class dining.',
    image:
      'https://images.unsplash.com/photo-1589708726759-4d6d6718d787?auto=format&fit=crop&w=800&q=80',
    popularPlaces: ['Bodrum Castle', 'Yalikavak Marina', 'Bodrum Amphitheater', 'Gumusluk Bay'],
    bestTimeToVisit: 'June - September',
    featured: false,
  },
  {
    id: '5',
    slug: 'ephesus-izmir',
    name: 'Ephesus & Izmir',
    region: 'Aegean',
    country: 'Turkey',
    tagline: 'Walk through ancient Roman history on the Aegean shore',
    description:
      'Ephesus is one of the best-preserved classical cities in the Mediterranean. Pair your history tour with Izmir’s palm-lined Kordon promenade and seaside charm.',
    image:
      'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    popularPlaces: [
      'Library of Celsus',
      'Great Theater of Ephesus',
      'House of Virgin Mary',
      'Izmir Kordon',
    ],
    bestTimeToVisit: 'April - June, September - November',
    featured: false,
  },
  {
    id: '6',
    slug: 'trabzon-rize',
    name: 'Trabzon & Rize',
    region: 'Black Sea',
    country: 'Turkey',
    tagline: 'Lush green tea highlands, mountain valleys, and cliffside monasteries',
    description:
      'Escape into the dramatic Black Sea highlands. Explore tea plantations in Rize, pristine alpine lakes in Uzungol, and the breathtaking Sumela Monastery built into sheer rock cliffs.',
    image:
      'https://images.unsplash.com/photo-1572003818138-19cf96ee15e7?auto=format&fit=crop&w=800&q=80',
    popularPlaces: ['Sumela Monastery', 'Uzungol Lake', 'Ayder Plateau', 'Zilkale Castle'],
    bestTimeToVisit: 'May - September',
    featured: false,
  },
];

export const MOCK_GUIDES = [
  {
    id: 'g1',
    slug: 'first-time-turkey-itinerary',
    title: 'The Ultimate 10-Day First-Timer Itinerary for Turkey',
    category: 'Trip Planning',
    destinationSlug: 'istanbul',
    readTime: '8 min read',
    publishedAt: '2026-08-15',
    summary:
      'How to connect Istanbul, Cappadocia, and Ephesus into one seamless, stress-free route with optimal travel times.',
    coverImage:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
    content: `
      Planning your first trip to Turkey can feel overwhelming with so many historical wonders and natural beauty spots. This 10-day itinerary balances iconic sights with smooth regional connections.

      ### Days 1–3: Historic Istanbul
      Start in Sultanahmet. Visit Hagia Sophia, the Blue Mosque, and the Grand Bazaar. Take an afternoon Bosphorus sunset cruise to appreciate the city's unique position between two continents.

      ### Days 4–6: Fairy Chimneys of Cappadocia
      Fly or drive to Cappadocia. Experience a sunrise hot air balloon flight over Goreme valley, explore underground cities, and sleep in an authentic cave hotel.

      ### Days 7–9: Ancient Ephesus & Aegean Coast
      Head west to Izmir and Selcuk to marvel at the marble streets of Ephesus, the Library of Celsus, and nearby Sirince village.

      ### Day 10: Departure
      Return to Istanbul for your homebound flight with unforgettable memories.
    `,
  },
  {
    id: 'g2',
    slug: 'cappadocia-balloon-guide',
    title: 'Complete Guide to Hot Air Ballooning in Cappadocia',
    category: 'Adventure',
    destinationSlug: 'cappadocia',
    readTime: '5 min read',
    publishedAt: '2026-08-28',
    summary:
      'Best seasons, weather conditions, safety standards, and booking tips for an unforgettable sunrise flight.',
    coverImage:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=800&q=80',
    content: `
      Floating over Cappadocia's surreal landscape as dozens of balloons rise into the morning sky is a true bucket-list experience.

      ### When to Fly
      Flights run year-round, weather permitting. Spring (April–June) and Autumn (September–October) offer ideal temperatures and calm wind conditions.

      ### Booking Tips
      Book your flight for your first available morning in Cappadocia. If bad weather cancels the flight, you'll still have backup mornings left in your itinerary.
    `,
  },
  {
    id: 'g3',
    slug: 'best-mediterranean-beaches',
    title: 'Top 7 Hidden Beaches Along the Turquoise Coast',
    category: 'Beaches & Nature',
    destinationSlug: 'antalya',
    readTime: '6 min read',
    publishedAt: '2026-09-02',
    summary:
      'From Kaputas Beach to Butterfly Valley, discover secluded bays and crystal clear waters on your road trip.',
    coverImage:
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    content: `
      Turkey's southwestern coast boasts some of the cleanest turquoise waters in Europe. Rent a car or hire a local driver to explore these spectacular coastal gems.

      ### 1. Kaputas Beach
      A breathtaking gorge opening onto bright turquoise waters between Kas and Kalkan.

      ### 2. Butterfly Valley (Kelebekler Vadisi)
      Accessible by boat from Oludeniz, surrounded by 350m high cliffs.
    `,
  },
  {
    id: 'g4',
    slug: 'turkish-cuisine-foodie-guide',
    title: 'A Food Lover’s Guide to Regional Turkish Cuisine',
    category: 'Culinary',
    destinationSlug: 'ephesus-izmir',
    readTime: '7 min read',
    publishedAt: '2026-09-10',
    summary:
      'Discover Aegean olive oil dishes, Black Sea pastries, and Southeastern kebabs on your route.',
    coverImage:
      'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    content: `
      Turkish food goes far beyond street kebabs. Each region boasts distinct culinary traditions influenced by geography and history.

      ### Aegean Delights
      Fresh wild greens, artichokes, and olive oil cold starters (zeytinyağlılar).

      ### Black Sea Savories
      Kuymak (melted cheese and cornmeal), fresh anchovies (hamsi), and aromatic teas.
    `,
  },
];

export const MOCK_AGENCIES = [
  {
    id: '1',
    agencyName: 'Anatolia Heritage Travel',
    city: 'Istanbul',
    country: 'Turkey',
    bio: 'Specialized in bespoke cultural circuits, private guides, and historical itineraries across Turkey.',
    specialties: ['Cultural Tours', 'Private Drivers', 'VIP Transfers', 'Luxury Hotels'],
    languages: ['English', 'Turkish', 'German'],
    verified: true,
  },
  {
    id: '2',
    agencyName: 'Turquoise Coast Expeditions',
    city: 'Antalya',
    country: 'Turkey',
    bio: 'Coastal travel specialists focusing on Mediterranean beach resorts, gulet yacht charters, and blue cruises.',
    specialties: ['Coastal Routes', 'Yacht Charters', 'Beach Resorts', 'Family Holidays'],
    languages: ['English', 'Turkish', 'Russian'],
    verified: true,
  },
  {
    id: '3',
    agencyName: 'Fairy Chimney Tours & Ballooning',
    city: 'Nevsehir',
    country: 'Turkey',
    bio: 'Local Cappadocia experts for balloon rides, boutique cave hotel stays, and hiking itineraries.',
    specialties: ['Balloon Rides', 'Cave Hotels', 'Trekking', 'Photography Tours'],
    languages: ['English', 'Turkish', 'Spanish'],
    verified: true,
  },
  {
    id: '4',
    agencyName: 'Aegean Breezes Tourism',
    city: 'Izmir',
    country: 'Turkey',
    bio: 'Custom travel planning for Ephesus, Pamukkale, Bodrum, and the Turkish Riviera.',
    specialties: ['Ancient Sites', 'Wine & Culinary', 'Boutique Escapes', 'Self-Drive Routes'],
    languages: ['English', 'Turkish', 'French'],
    verified: true,
  },
];
