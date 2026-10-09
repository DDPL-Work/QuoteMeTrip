/**
 * Controlled public dataset for QuoteMeTrip (Track B).
 *
 * Mock repository for destinations, travel services, travel guides,
 * countries, and public agency profiles. Prepared for seamless API replacement
 * when backend CMS endpoints arrive.
 */

export const MOCK_COUNTRIES = [
  {
    slug: 'turkey',
    name: 'Turkey (Türkiye)',
    tagline: 'Crossroads of civilizations, turquoise shores, and surreal landscapes',
    description:
      'Turkey bridges Europe and Asia with an astonishing tapestry of history, geography, and world-renowned hospitality. From the minarets and bazaars of Istanbul to the volcanic fairy chimneys of Cappadocia, the gleaming white travertines of Pamukkale, the classical marbles of Ephesus, and the sun-drenched Turquoise Coast of Antalya, Turkey offers unmatched diversity for customized travel itineraries.',
    heroImage:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80',
    travelInfo: {
      capital: 'Ankara',
      largestCity: 'Istanbul',
      currency: 'Turkish Lira (TRY)',
      languages: 'Turkish (English widely spoken in tourism hubs)',
      timeZone: 'GMT+3 (TRT)',
      bestTimeToVisit: 'April - June, September - November',
      entryRequirements: 'E-visa available online for most nationalities',
      internationalAirports: 'Istanbul (IST / SAW), Antalya (AYT), Izmir (ADB), Bodrum (BJV)',
    },
    destinationSlugs: ['istanbul', 'cappadocia', 'antalya', 'pamukkale', 'efes', 'bodrum', 'trabzon-rize'],
  },
];

export const MOCK_DESTINATIONS = [
  {
    id: '1',
    slug: 'istanbul',
    countrySlug: 'turkey',
    name: 'Istanbul',
    region: 'Marmara',
    country: 'Turkey',
    tagline: 'Where East meets West across the historic Bosphorus',
    description:
      'Istanbul is a captivating metropolis straddling Europe and Asia. Explore world-renowned landmarks like the Hagia Sophia, Blue Mosque, Topkapi Palace, and Grand Bazaar, while enjoying vibrant waterfront cafes and sunset Bosphorus cruises.',
    image:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
    popularPlaces: [
      'Hagia Sophia',
      'Bosphorus Cruise',
      'Grand Bazaar',
      'Topkapi Palace',
      'Galata Tower',
      'Sultanahmet Square',
    ],
    bestTimeToVisit: 'April - May, September - November',
    relevantServiceSlugs: ['private-tours', 'private-transfer', 'guide'],
    featured: true,
  },
  {
    id: '2',
    slug: 'cappadocia',
    countrySlug: 'turkey',
    name: 'Cappadocia',
    region: 'Central Anatolia',
    country: 'Turkey',
    tagline: 'Fairy chimneys, hot air balloons, and underground cities',
    description:
      'Famous for its honeycomb hills, volcanic fairy chimneys, and ancient cave dwellings. Rise at sunrise for an unforgettable hot air balloon flight over valleys carved by millennial erosions.',
    image:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=800&q=80',
    popularPlaces: [
      'Goreme Open Air Museum',
      'Love Valley & Rose Valley',
      'Derinkuyu Underground City',
      'Uchisar Castle',
      'Pigeon Valley',
    ],
    bestTimeToVisit: 'April - June, September - October',
    relevantServiceSlugs: ['hot-air-balloon', 'private-tours', 'guide', 'minibus-with-driver'],
    featured: true,
  },
  {
    id: '3',
    slug: 'antalya',
    countrySlug: 'turkey',
    name: 'Antalya',
    region: 'Mediterranean',
    country: 'Turkey',
    tagline: 'The Turquoise Coast jewel with golden beaches and ancient ruins',
    description:
      'Nestled on the Mediterranean coast, Antalya combines turquoise waters with historic Kaleici old town, dramatic waterfalls, and nearby Greco-Roman amphitheaters.',
    image:
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    popularPlaces: [
      'Kaleici Old Town',
      'Duden Waterfalls',
      'Aspendos Roman Theater',
      'Perge Ancient City',
      'Konyaalti Beach',
    ],
    bestTimeToVisit: 'May - October',
    relevantServiceSlugs: ['private-tours', 'private-transfer', 'minibus-with-driver'],
    featured: true,
  },
  {
    id: '4',
    slug: 'pamukkale',
    countrySlug: 'turkey',
    name: 'Pamukkale',
    region: 'Aegean',
    country: 'Turkey',
    tagline: 'Snow-white travertine terraces and thermal Roman healing springs',
    description:
      'Pamukkale ("Cotton Castle") is a surreal natural wonder where warm mineral-rich waters cascade down gleaming white limestone terraces. Directly above lies Hierapolis, a celebrated Greco-Roman thermal spa city featuring the Cleopatra Antique Pool and an immense Roman theatre.',
    image:
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&w=800&q=80',
    popularPlaces: [
      'White Travertine Terraces',
      'Hierapolis Ancient City',
      'Cleopatra Antique Pool',
      'Hierapolis Roman Amphitheater',
      'Hierapolis Archaeology Museum',
    ],
    bestTimeToVisit: 'April - June, September - November',
    relevantServiceSlugs: ['private-tours', 'guide', 'private-transfer'],
    featured: true,
  },
  {
    id: '5',
    slug: 'efes',
    countrySlug: 'turkey',
    name: 'Efes (Ephesus)',
    region: 'Aegean',
    country: 'Turkey',
    tagline: 'Walk through classical Roman history along grand marble streets',
    description:
      'Ephesus (Efes) is one of the grandest and best-preserved Greco-Roman classical cities in the Mediterranean. Walk down the marble Curetes Street to the iconic two-story Library of Celsus, the 25,000-seat Great Theatre, and the nearby sacred House of the Virgin Mary in Selcuk.',
    image:
      'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    popularPlaces: [
      'Library of Celsus',
      'Great Theatre of Ephesus',
      'Terraced Houses',
      'Temple of Hadrian',
      'House of the Virgin Mary',
      'Sirince Hilltop Village',
    ],
    bestTimeToVisit: 'March - May, September - November',
    relevantServiceSlugs: ['guide', 'private-tours', 'private-transfer'],
    featured: true,
  },
  {
    id: '6',
    slug: 'bodrum',
    countrySlug: 'turkey',
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
    relevantServiceSlugs: ['private-transfer', 'private-tours'],
    featured: false,
  },
  {
    id: '7',
    slug: 'trabzon-rize',
    countrySlug: 'turkey',
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
    relevantServiceSlugs: ['minibus-with-driver', 'private-tours'],
    featured: false,
  },
];

export const MOCK_SERVICES = [
  {
    id: 's1',
    slug: 'private-tours',
    name: 'Private Tours',
    title: 'Private Tours & Tailor-Made Sightseeing',
    tagline: 'Personalized sightseeing circuits with certified local guides and flexible pacing',
    summary:
      'Explore Turkey on your own schedule. Private tours pair you with licensed local guides and dedicated vehicles, offering skip-the-line museum admissions and personalized itineraries tailored precisely to your group.',
    image:
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1200&q=80',
    inclusions: [
      'Dedicated licensed professional guide in your preferred language',
      'Flexible start times and custom route pacing',
      'Air-conditioned VIP transport with private driver',
      'Pre-arranged skip-the-line museum tickets',
      'Authentic local dining and artisan workshop recommendations',
    ],
    destinations: ['Istanbul', 'Cappadocia', 'Antalya', 'Pamukkale', 'Efes (Ephesus)'],
    highlights: [
      'No crowded tour buses or fixed schedules',
      'Complete itinerary customization with local experts',
      'Direct coordination with verified travel operators',
    ],
  },
  {
    id: 's2',
    slug: 'private-transfer',
    name: 'Private Transfer',
    title: 'Private Airport & Intercity Transfers',
    tagline: 'Punctual, comfortable door-to-door transportation across Turkey',
    summary:
      'Enjoy seamless airport pickups and point-to-point intercity travel. Professional chauffeurs track your flight in real time, greet you inside arrivals with a name board, and transport you safely in modern Mercedes fleet vehicles.',
    image:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
    inclusions: [
      'Live flight tracking with 60 minutes free waiting time at arrivals',
      'Meet & Greet service with name board inside terminal',
      'Fixed transparent pricing including fuel, highway tolls, and parking',
      'Modern Mercedes Vito or Sprinter fleet with Wi-Fi and complimentary water',
      '24/7 dispatch support and direct driver contact',
    ],
    destinations: ['Istanbul (IST & SAW)', 'Antalya (AYT)', 'Nevsehir / Kayseri', 'Izmir (ADB)', 'Bodrum (BJV)'],
    highlights: [
      'Zero surprise surge fees or taxi meter worries',
      'Sanitized, child-seat equipped executive vans',
      'Reliable intercity transfers connecting popular holiday hubs',
    ],
  },
  {
    id: 's3',
    slug: 'minibus-with-driver',
    name: 'Minibus with Driver',
    title: 'Minibus & Van Rental with Professional Driver',
    tagline: 'Chauffeured vans for families, groups, and multi-day travel routes',
    summary:
      'Travel together comfortably without navigating unfamiliar roads, tolls, or parking. Hire a private Mercedes Sprinter or Vito with an experienced chauffeur for daily excursions or complete multi-day routes across Turkey.',
    image:
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    inclusions: [
      'Spacious 9-to-16 passenger air-conditioned Mercedes vans',
      'Experienced chauffeur licensed for commercial passenger transit',
      'Fuel, highway tolls, and parking fees included',
      'Ample luggage capacity for long multi-city journeys',
      'Custom daily pickup times and door-to-door drop-offs',
    ],
    destinations: ['Istanbul & Marmara', 'Cappadocia & Anatolia', 'Aegean Coastline', 'Mediterranean Riviera'],
    highlights: [
      'Ideal for family holidays and group travel',
      'Total flexibility to stop at scenic viewpoints along your route',
      'Stress-free travel without international car rental complications',
    ],
  },
  {
    id: 's4',
    slug: 'guide',
    name: 'Licensed Guide',
    title: 'Official Licensed Professional Tour Guides',
    tagline: 'Ministry of Tourism certified experts bringing history and culture to life',
    summary:
      'Experience Turkey with an accredited historian and local storyteller. Our partner agencies connect you with certified guides fluent in English, Spanish, German, French, Italian, and other languages.',
    image:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    inclusions: [
      'Official accreditation from Turkish Ministry of Culture & Tourism (TUREB)',
      'In-depth architectural, archaeological, and cultural storytelling',
      'Skip-the-line museum escort privileges at major historical sites',
      'Fluent multi-lingual communication',
      'Local etiquette advice, shopping assistance, and dining tips',
    ],
    destinations: ['Istanbul', 'Cappadocia', 'Efes (Ephesus)', 'Gallipoli & Troy', 'Antalya', 'Pamukkale'],
    highlights: [
      'Certified guides with university degrees in art history or archaeology',
      'Deep historical context you cannot get from a guidebook',
      'Personalized attention focused on your group’s interests',
    ],
  },
  {
    id: 's5',
    slug: 'hot-air-balloon',
    name: 'Hot Air Balloon',
    title: 'Cappadocia Sunrise Hot Air Balloon Flights',
    tagline: 'Soar above fairy chimneys, orchards, and volcanic valleys at dawn',
    summary:
      'Floating in a hot air balloon over Cappadocia as the morning sunrise illuminates fairy chimneys is an iconic world-class experience. We partner exclusively with certified balloon companies maintaining the highest civil aviation safety standards.',
    image:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1200&q=80',
    inclusions: [
      '60 to 75-minute sunrise flight over Cappadocia’s surreal valleys',
      'Hotel pickup and return transfer in air-conditioned vehicles',
      'Light pre-flight breakfast with coffee and tea',
      'Traditional Champagne / juice toast upon landing',
      'Personalized commemorative flight certificate',
      'Comprehensive civil aviation passenger insurance',
    ],
    destinations: ['Cappadocia (Goreme, Cat, Soganli)', 'Pamukkale'],
    highlights: [
      'Flown by veteran pilots certified by Turkish Civil Aviation',
      'Free rescheduling or full refund in case of wind cancellations',
      'Unrivalled 360-degree panoramic photography opportunities',
    ],
  },
];

export const MOCK_GUIDES = [
  {
    id: 'g-istanbul',
    slug: 'istanbul',
    title: 'Complete Travel Guide to Istanbul',
    category: 'City Guide',
    destinationSlug: 'istanbul',
    readTime: '9 min read',
    publishedAt: '2026-09-01',
    summary:
      'How to connect historic Sultanahmet, lively Beyoglu, and scenic Bosphorus waterways into a memorable 3 to 4 day Istanbul stay.',
    coverImage:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
    content: `
      Istanbul is a city where centuries of Roman, Byzantine, and Ottoman history blend with contemporary cosmopolitan life. Straddling Europe and Asia across the Bosphorus Strait, it offers an unforgettable introduction to Turkey.

      ### Days 1–2: The Historic Heart of Sultanahmet
      Begin in Sultanahmet Square. Stand in awe beneath the soaring dome of the 1,500-year-old Hagia Sophia, explore the intricate blue Iznik tiles of the Sultan Ahmed Mosque, and wander the opulent courtyards and Imperial Harem of Topkapi Palace. Descend into the sunken Basilica Cistern with its Medusa-head columns for an atmospheric respite from the sun.

      ### Day 3: Bazaars and Bosphorus Waterfront
      Dedicate a morning to getting lost in the Grand Bazaar’s labyrinth of spices, lanterns, and textiles. Continue downhill to the Spice Bazaar (Misir Carsisi) in Eminonu. In the afternoon, board a public ferry or private yacht cruise along the Bosphorus to take in Ottoman waterfront mansions (yalis), Maiden's Tower, and the twin suspension bridges.

      ### Day 4: Galata, Karakoy & Modern Istanbul
      Cross the Galata Bridge into Karakoy and climb to the top of Galata Tower for 360-degree panoramic views of the Golden Horn. Stroll up pedestrianized Istiklal Street to Taksim Square, stopping for Turkish coffee and roasted pistachio baklava along the side alleys of Cukurcuma.
    `,
  },
  {
    id: 'g-cappadocia',
    slug: 'cappadocia',
    title: 'Cappadocia Travel & Hot Air Balloon Guide',
    category: 'Adventure',
    destinationSlug: 'cappadocia',
    readTime: '7 min read',
    publishedAt: '2026-09-05',
    summary:
      'Fairy chimneys, sunrise balloon flights, cave hotel recommendations, and underground cities in Central Anatolia.',
    coverImage:
      'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=800&q=80',
    content: `
      Cappadocia's otherworldly volcanic landscape was carved over millions of years by wind and water into fairy chimneys, subterranean towns, and honeycomb cave dwellings.

      ### Sunrise Hot Air Ballooning
      The quintessential Cappadocia bucket-list experience. Hot air balloons lift off at dawn, floating silently hundreds of meters above the valleys as dozens of colorful balloons fill the sky. Always book flights for your first morning in the region, leaving backup days in case of wind cancellations.

      ### Goreme Open Air Museum & Rose Valley
      Explore rock-cut Byzantine cave churches adorned with vibrant 10th-century frescoes at Goreme Open Air Museum. In the late afternoon, hike through Rose and Red Valleys where sunset turns the sandstone cliffs brilliant shades of pink and crimson.

      ### Underground Cities of Derinkuyu & Kaymakli
      Carved several storeys into volcanic tuff rock, these ancient subterranean cities sheltered thousands of early Christians during wartime, complete with ventilation shafts, stables, wine presses, and chapels.
    `,
  },
  {
    id: 'g-gallipoli',
    slug: 'gallipoli',
    title: 'Gallipoli Peninsula & Anzac Cove Historical Guide',
    category: 'History & Culture',
    destinationSlug: 'gallipoli',
    readTime: '8 min read',
    publishedAt: '2026-09-12',
    summary:
      'A deeply moving guide to Gallipoli Historical National Park, Anzac Cove, Lone Pine, Chunuk Bair, and navigating the Dardanelles Strait.',
    coverImage:
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    content: `
      Situated along the narrow Dardanelles Strait in northwestern Turkey, the Gallipoli (Gelibolu) Peninsula holds monumental significance in modern military history and national identity for Turkey, Australia, and New Zealand.

      ### Key Historical Battlefields
      - **Anzac Cove:** The historic landing beach where allied forces came ashore at dawn on 25 April 1915.
      - **Lone Pine Memorial & Cemetery:** Commemorating Australian soldiers who fought in one of the most intense battles of the campaign.
      - **Chunuk Bair:** Crowned by the New Zealand memorial and the statue of Mustafa Kemal Ataturk commanding the decisive counter-offensive.
      - **Canakkale Martyrs’ Memorial (Canakkale Sehitleri Abidesi):** The monumental Turkish tribute overlooking the mouth of the Dardanelles.

      ### Travel Tips for Gallipoli
      Stay in Canakkale or Eceabat to access the national park easily. Hiring a licensed military history guide brings the stories, letters, and trench networks vividly to life. Pair your visit with nearby ancient Troy (Truva).
    `,
  },
  {
    id: 'g-pamukkale',
    slug: 'pamukkale',
    title: 'Pamukkale Travertines & Hierapolis Complete Guide',
    category: 'Nature & Heritage',
    destinationSlug: 'pamukkale',
    readTime: '6 min read',
    publishedAt: '2026-09-18',
    summary:
      'How to visit the glowing white calcite terraces of Pamukkale, swim among submerged Roman columns in Cleopatra Antique Pool, and explore ancient Hierapolis.',
    coverImage:
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&w=800&q=80',
    content: `
      Pamukkale, translating to "Cotton Castle" in Turkish, is a natural geological marvel recognized alongside ancient Hierapolis as a UNESCO World Heritage site.

      ### The Calcite Travertine Pools
      Thermal mineral waters saturated with calcium carbonate emerge at 35°C from deep underground springs, cooling as they spill down the cliffside to form shimmering white terraces and shallow turquoise pools. Visitors are required to remove footwear to preserve the delicate limestone formations.

      ### Hierapolis Roman Spa City
      Founded by the Kings of Pergamum in the 2nd century BC, Hierapolis was famed throughout the ancient Roman empire for its curative waters. Tour the immaculately restored Roman Amphitheatre, the monumental Frontinus Gate, and the vast ancient Necropolis with over 1,200 sarcophagi.

      ### Cleopatra Antique Pool
      Take a restorative swim in the naturally heated mineral waters of Cleopatra's Pool, where ancient marble Corinthian columns toppled by an earthquake in 692 AD lie submerged on the pool floor.
    `,
  },
  {
    id: 'g-ephesus',
    slug: 'ephesus',
    title: 'Ephesus Ancient City & Aegean Coast Guide',
    category: 'Archaeology',
    destinationSlug: 'efes',
    readTime: '8 min read',
    publishedAt: '2026-09-22',
    summary:
      'Step back into classical antiquity with this guide to the Library of Celsus, the Great Theatre, the Terraced Houses of Ephesus, and nearby picturesque Sirince.',
    coverImage:
      'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80',
    content: `
      Once one of the largest classical metropolises in the Roman Empire, Ephesus (Efes) is one of the most rewarding archaeological sites on Earth.

      ### Marvels of Ephesus
      - **Library of Celsus:** The iconic two-story marble facade built in 117 AD, once housing over 12,000 parchment scrolls.
      - **The Great Theatre:** Carved into the slope of Mount Pion, this 25,000-seat amphitheater hosted gladiator spectacles and early Christian gatherings.
      - **The Terraced Houses (Yamaç Evleri):** Step beneath the protective canopy to examine the luxurious multi-story villas of Roman aristocrats, preserved with vibrant wall frescoes and geometric floor mosaics.
      - **Temple of Hadrian:** Renowned for its intricate relief friezes of Medusa and mythological deities.

      ### Nearby Excursions
      Just a few kilometers from Selcuk, visit the peaceful stone cottage believed to be the final home of the Virgin Mary (Meryem Ana Evi). In the afternoon, wind up into the olive groves to Sirince, a charming Aegean village famous for stone houses and fruit wines.
    `,
  },
  {
    id: 'g-antalya',
    slug: 'antalya',
    title: 'Antalya & The Turquoise Coast Guide',
    category: 'Coast & Beaches',
    destinationSlug: 'antalya',
    readTime: '7 min read',
    publishedAt: '2026-09-25',
    summary:
      'From Kaleici historic old town and dramatic Duden waterfalls to ancient Aspendos amphitheatre and turquoise Mediterranean beaches.',
    coverImage:
      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    content: `
      Where the Taurus Mountains descend directly into the azure Mediterranean Sea, Antalya serves as the capital of the Turkish Riviera, blending beach holidays with ancient Greco-Roman ruins.

      ### Kaleici Old Town & Hadrian’s Gate
      Enter historic Kaleici through the triple-arched marble gate dedicated to Roman Emperor Hadrian in 130 AD. Wander narrow cobblestone alleys framed by Ottoman timber mansions, boutique hotels, and bougainvillea, ending at the ancient Roman harbor.

      ### Duden Waterfalls & Mediterranean Beaches
      Witness Lower Duden Waterfall as it thunders off 40-meter cliffs straight into the Mediterranean Sea. For beach days, head west to pebbled Konyaalti Beach backed by dramatic mountain peaks, or east to golden sandy Lara Beach.

      ### Aspendos & Perge Ancient Cities
      A short drive east of Antalya stands Aspendos, universally acknowledged as the best-preserved classical Roman theatre in the world, still hosting opera and ballet performances today.
    `,
  },
];

export const MOCK_AGENCIES = [
  {
    id: '1',
    agencyName: 'Anatolia Heritage Travel',
    city: 'Istanbul',
    locationSlug: 'istanbul',
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
    locationSlug: 'antalya',
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
    locationSlug: 'cappadocia',
    country: 'Turkey',
    bio: 'Local Cappadocia experts for sunrise balloon rides, boutique cave hotel stays, and hiking itineraries.',
    specialties: ['Balloon Rides', 'Cave Hotels', 'Trekking', 'Photography Tours'],
    languages: ['English', 'Turkish', 'Spanish'],
    verified: true,
  },
  {
    id: '4',
    agencyName: 'Aegean Breezes Tourism',
    city: 'Izmir',
    locationSlug: 'turkey',
    country: 'Turkey',
    bio: 'Custom travel planning for Ephesus, Pamukkale, Bodrum, and the Turkish Riviera.',
    specialties: ['Ancient Sites', 'Wine & Culinary', 'Boutique Escapes', 'Self-Drive Routes'],
    languages: ['English', 'Turkish', 'French'],
    verified: true,
  },
];
