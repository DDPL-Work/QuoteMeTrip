// @troublefree/i18n
//
// Centralized translation catalog and formatting utilities for English and Turkish.
// Supports static locale catalog, string interpolation, date/currency/number formatting,
// and React hooks for dynamic content translation with persistent MySQL backend caching.

import { createContext, useContext, useState, useMemo, createElement, useEffect } from 'react';

export const SUPPORTED_LOCALES = ['en', 'tr'];
export const DEFAULT_LOCALE = 'en';

export const TRANSLATIONS = {
  en: {
    // Navigation & Header
    'header.home': 'Home',
    'header.dashboard': 'Dashboard',
    'header.destinations': 'Destinations',
    'header.travelServices': 'Travel Services',
    'header.travelGuide': 'Travel Guide',
    'header.travelGuides': 'Travel Guides',
    'header.agencies': 'Agencies',
    'header.howItWorks': 'How It Works',
    'header.about': 'About Us',
    'header.aboutUs': 'About Us',
    'header.contact': 'Contact',
    'header.login': 'Sign In',
    'header.register': 'Register',
    'header.planTrip': 'Plan My Trip',
    'header.myTrips': 'My Trips',
    'header.profile': 'Profile',
    'header.signOut': 'Sign Out',
    'header.notifications': 'Notifications',

    // Home Hero & Search
    'home.hero.title': 'PLAN YOUR PERFECT TRIP',
    'home.hero.subtitle':
      'Discover destinations. Build your custom route. Receive competitive quotations from verified local travel agencies.',
    'home.hero.cta': 'Plan My Trip',
    'home.hero.eyebrow': 'Day-by-day holidays · local agencies',
    'home.hero.headline1': 'One request.',
    'home.hero.headline2': 'Multiple travel quotes.',
    'home.hero.lead':
      'Plan each day of your trip — dates, destinations, hotels, guides and activities. Verified agencies in that country send you their offers to compare.',

    'home.search.country': 'Country',
    'home.search.startDate': 'Start date',
    'home.search.duration': 'Duration',
    'home.search.days': 'days',
    'home.search.travellers': 'Travellers',
    'home.search.people': 'people',
    'home.search.scope': 'Service Scope',
    'home.search.planButton': 'Plan My Trip',
    'home.search.getQuotes': 'Get free quotes',
    'home.search.chooseDates': 'Choose dates',
    'home.search.flexibleDates': 'My dates are flexible',
    'home.search.suggestRoute': 'Let agencies suggest the route',
    'home.search.howItWorks': 'How does it work?',

    'home.trust.verified': 'Verified agencies',
    'home.trust.verifiedDesc': 'Documents checked by our team',
    'home.trust.freeRequest': 'Free request',
    'home.trust.freeRequestDesc': 'No fee for travellers',
    'home.trust.compareOffers': 'Compare offers',
    'home.trust.compareOffersDesc': 'Price, inclusions, ratings',
    'home.trust.payDirect': 'Pay the agency directly',
    'home.trust.payDirectDesc': 'On the agency’s own terms',
    'home.trust.support': 'Support',
    'home.trust.supportDesc': 'We step in if needed',

    'home.routes.title': 'Popular Travel Routes',
    'home.routes.subtitle': 'Inspiring multi-day itineraries crafted by local travel specialists.',
    'home.routes.viewAll': 'Explore All Routes',

    'home.destinations.title': 'Popular Destinations',
    'home.destinations.subtitle':
      "Handpicked travel spots across Turkey's most iconic and breathtaking regions.",
    'home.destinations.viewAll': 'Explore Destinations',

    'home.howItWorks.title': 'How QuoteMeTrip works',
    'home.howItWorks.subtitle': '3 simple steps from route planning to booked vacation',
    'home.howItWorks.learnMore': 'Learn more →',
    'home.howItWorks.step1Title': '01. Choose Your Route',
    'home.howItWorks.step1Desc':
      'Select your starting point, intermediate stops, and final destination on our interactive route builder.',
    'home.howItWorks.step2Title': '02. Specify Requirements',
    'home.howItWorks.step2Desc':
      'Tell us your hotel preferences, vehicle type, travel dates, and group size.',
    'home.howItWorks.step3Title': '03. Receive Quotations',
    'home.howItWorks.step3Desc':
      'Verified local travel agencies craft itemized offers tailored to your itinerary.',
    'home.howItWorks.step4Title': '04. Compare & Choose',
    'home.howItWorks.step4Desc':
      'Message agencies, compare prices line-by-line, accept the best deal, and track your trip.',
    'home.howItWorks.step1Badge': 'STEP 1 · 5 MINUTES',
    'home.howItWorks.step2Badge': 'STEP 2 · 24–48 HOURS',
    'home.howItWorks.step3Badge': 'STEP 3 · SAME DAY',
    'home.howItWorks.card1Title': 'Build your itinerary, day by day',
    'home.howItWorks.card1Desc':
      'Choose Turkey, then specify dates and destinations for each day. Customize hotel class, vehicle needs, and tours — or let local agencies propose an optimal route.',
    'home.howItWorks.card2Title': 'Receive quotes from local agencies',
    'home.howItWorks.card2Desc':
      'Your itinerary is broadcast exclusively to verified, licensed travel agencies in Turkey. They calculate total costs and return comprehensive itemized quotations.',
    'home.howItWorks.card3Title': 'Agree, pay directly, get confirmed',
    'home.howItWorks.card3Desc':
      'Accept your favored quotation. The agency provides their official secure payment link or bank invoice. You pay the agency directly with zero intermediary handling.',
    'home.howItWorks.step1Tick1': 'Add, remove, and reorder stops at your pace',
    'home.howItWorks.step1Tick2': 'Specify private guides, drivers, or balloon rides',
    'home.howItWorks.step1Tick3': 'Mention traveller count, baggage, and dietary needs',
    'home.howItWorks.step1Tick4': 'Option to let agencies propose the complete route',
    'home.howItWorks.step1Tip': 'Not sure of the route? Tick “let agencies suggest the route” and they will propose one.',
    'home.howItWorks.step1Cta': 'Build my itinerary',
    'home.howItWorks.step1CtaArrow': 'Start Building Route →',

    'home.howItWorks.step2Tick1': 'Side-by-side comparison of prices and inclusions',
    'home.howItWorks.step2Tick2': 'Chat directly with operators to fine-tune details',
    'home.howItWorks.step2Tick3': 'Agency contact info unlocks safely upon acceptance',
    'home.howItWorks.step2Tick4': '100% free for travellers — zero platform markup',
    'home.howItWorks.step2Tip': 'Free for travellers. Agencies pay QuoteMeTrip, never you.',
    'home.howItWorks.step2Cta': 'See my quotes',
    'home.howItWorks.step2CtaArrow': 'How Quotes Work →',

    'home.howItWorks.step3Tick1': 'Acceptance locks your price and closes competing bids',
    'home.howItWorks.step3Tick2': 'Receive official booking voucher and PDF itinerary',
    'home.howItWorks.step3Tick3': 'Direct phone, WhatsApp & email unlocked instantly',
    'home.howItWorks.step3Tick4': 'Review and rate your agency after your journey',
    'home.howItWorks.step3Tip': 'After the trip you rate the agency from 1 to 5 stars, which helps the next traveller.',
    'home.howItWorks.step3Cta': 'See the booking steps',
    'home.howItWorks.step3CtaArrow': 'Plan My Trip →',

    // Dedicated How It Works Page
    'howItWorks.page.title': 'How QuoteMeTrip Works',
    'howItWorks.page.subtitle': 'Three simple, transparent steps from your initial travel idea to a confirmed, paid-for holiday with zero traveller fees.',
    'howItWorks.page.realLocalExpertise': 'Real Local Expertise',
    'howItWorks.page.photobandTitle': 'Every day planned. Every quote compared.',
    'howItWorks.page.photobandDesc': 'Unlike rigid packaged bus tours or opaque online travel agents, QuoteMeTrip puts you in the driver’s seat. You define the exact sequence of destinations and travel pacing. Local licensed agencies then bid against each other to deliver the best value and personal service.',
    'howItWorks.page.statusTitle': 'Your Trip Status, From Start to Finish',
    'howItWorks.page.statusSubtitle': 'Real-time visibility into your quotation requests and booking stages.',
    'howItWorks.page.ctaTitle': 'Ready to Build Your Turkey Route?',
    'howItWorks.page.ctaSubtitle': 'Take 5 minutes to set your itinerary and start receiving tailored quotes.',

    // Journey Status Timeline
    'journey.status.title': 'Your trip status, from start to finish',
    'journey.status.draft': 'Draft',
    'journey.status.draftDesc': 'You are still planning',
    'journey.status.sent': 'Sent',
    'journey.status.sentDesc': 'Agencies in your country notified',
    'journey.status.quotesReceived': 'Quotes received',
    'journey.status.quotesReceivedDesc': 'Compare the offers',
    'journey.status.agreed': 'Agreed',
    'journey.status.agreedDesc': 'Price locked, quoting closed',
    'journey.status.depositPaid': 'Deposit paid',
    'journey.status.depositPaidDesc': 'Contacts unlocked',
    'journey.status.confirmed': 'Confirmed',
    'journey.status.confirmedDesc': 'Written confirmation + PDF',

    'home.whyUs.title': 'Why QuoteMeTrip?',
    'home.whyUs.subtitle':
      'Built specifically for route-first itinerary planning and transparent agency matching.',
    'home.whyUs.feature1Title': 'Route-First Planning',
    'home.whyUs.feature1Desc':
      'Map out multi-stop itineraries with automatic distance calculation and recommended day breakdown.',
    'home.whyUs.feature2Title': 'Multiple Agency Quotations',
    'home.whyUs.feature2Desc':
      'Receive competitive itemized offers directly from licensed local travel operators.',
    'home.whyUs.feature3Title': 'Direct In-App Messaging',
    'home.whyUs.feature3Desc':
      'Chat directly with agencies to refine itinerary details and confirm preferences.',
    'home.whyUs.feature4Title': 'Transparent Job Tracking',
    'home.whyUs.feature4Desc':
      'Accept your preferred quotation and monitor trip progress from booking to completion.',

    'home.guide.title': 'Travel Guide & Inspiration',
    'home.guide.subtitle': 'Expert advice, destination highlights, and practical travel tips.',
    'home.guide.viewAll': 'View Travel Guide',

    'home.agencies.title': 'Verified Travel Agencies',
    'home.agencies.subtitle':
      'Connect with experienced licensed travel operators across top destinations.',
    'home.agencies.viewAll': 'Explore Agencies',

    'home.faq.title': 'Frequently asked questions',
    'home.faq.subtitle': 'Everything you need to know about QuoteMeTrip.',
    'home.faq.contactUs': 'Have more questions? Contact our team.',

    'faq.q1': 'Is sending a request free?',
    'faq.a1': 'Yes. Creating an itinerary, receiving quotes and comparing them is free for travellers.',
    'faq.q2': 'Which agencies receive my itinerary?',
    'faq.a2': 'Only verified agencies operating in the country you choose.',
    'faq.q3': 'Can I edit my itinerary after sending?',
    'faq.a3': 'Yes, until you agree to a quote. The new version is sent to all agencies again.',
    'faq.q4': 'How do I pay for my holiday?',
    'faq.a4': 'Directly to the agency — through their payment link, bank transfer or cash.',
    'faq.q5': 'When are contact details shared?',
    'faq.a5': 'After you agree to a quote and confirm the deposit is paid.',
    'faq.q6': 'Can I print my itinerary?',
    'faq.a6': 'Yes. Every itinerary and confirmation can be printed or saved as PDF.',

    'home.cta.title': 'Ready to Plan Your Trip?',
    'home.cta.subtitle': 'Build your route now and start receiving competitive agency quotations.',
    'home.cta.button': 'Plan My Trip',

    // Public Pages
    'destinations.title': 'Explore Destinations',
    'destinations.subtitle': 'Discover inspiring places and start planning your travel route.',
    'destinations.searchPlaceholder': 'Search destinations by name or region...',
    'destinations.planCTA': 'Plan a Trip to',
    'destinations.overview': 'Overview',
    'destinations.highlights': 'Popular Highlights & Places',
    'destinations.relatedGuides': 'Related Travel Guides',
    'destinations.notFound': 'Destination Not Found',
    'destinations.notFoundDesc': 'The requested destination does not exist.',
    'destinations.backToDestinations': 'Back to Destinations',

    'guide.title': 'Travel Guides',
    'guide.subtitle': 'Handcrafted itineraries, regional insights, and essential travel tips.',
    'guide.searchPlaceholder': 'Search travel articles...',
    'guide.category.all': 'All Categories',
    'guide.category.cityGuide': 'City Guide',
    'guide.category.adventure': 'Adventure',
    'guide.category.historyCulture': 'History & Culture',
    'guide.category.natureHeritage': 'Nature & Heritage',
    'guide.category.archaeology': 'Archaeology',
    'guide.category.coastBeaches': 'Coast & Beaches',
    'guide.readTime': '{count} min read',
    'guide.read': 'READ',
    'guide.readArticle': 'Read Article',
    'guide.clearFilters': 'Clear Filters',
    'guide.adjustSearch': 'Try adjusting your search terms or filters.',
    'guide.published': 'Published',
    'guide.relatedGuides': 'Related Travel Guides',
    'guide.backToGuides': 'Back to Travel Guides',
    'guide.notFound': 'Article Not Found',
    'guide.notFoundDesc': 'The requested article does not exist.',

    'agencies.title': 'Travel Agencies',
    'agencies.subtitle': 'Browse verified local travel agencies ready to craft your custom vacation.',
    'agencies.searchPlaceholder': 'Search agencies by name or location...',

    'about.title': 'About QuoteMeTrip',
    'about.subtitle':
      'Empowering travellers to build custom routes and connect with trusted local agencies.',

    'contact.title': 'Contact Us',
    'contact.subtitle': 'Have questions or feedback? Get in touch with our support team.',
    'contact.name': 'Your Name',
    'contact.email': 'Your Email',
    'contact.subject': 'Subject',
    'contact.message': 'Message',
    'contact.send': 'Send Message',
    'contact.sending': 'Sending...',
    'contact.success': 'Thank you! Your message has been sent successfully.',

    // Common UI
    'common.explore': 'Explore',
    'common.readMore': 'Read Article',
    'common.viewProfile': 'View Agency',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.loading': 'Loading...',
    'common.empty': 'No results found matching your query.',
    'common.error': 'Failed to load content.',
    'common.retry': 'Try Again',
    'common.save': 'Save',
    'common.saving': 'Saving...',
    'common.saved': 'Saved',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.finish': 'Finish',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.actions': 'Actions',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.confirm': 'Confirm',
    'common.details': 'Details',
    'common.viewAll': 'View all',
    'common.refresh': 'Refresh',
    'common.language': 'Language',
    'footer.copyright': '© QuoteMeTrip. All rights reserved.',

    // Authentication
    'auth.signIn': 'Sign In',
    'auth.register': 'Create Account',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.role': 'Account Type',
    'auth.role.traveller': 'Traveller',
    'auth.role.agency': 'Travel Agency',
    'auth.googleSignIn': 'Continue with Google',
    'auth.forgotPassword': 'Forgot password?',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.signingIn': 'Signing in...',
    'auth.registering': 'Creating account...',

    // Dashboard
    'dashboard.welcome': 'Good {timeOfDay}, {name} 👋',
    'dashboard.welcome.default': 'Welcome back, {name} 👋',
    'dashboard.welcome.time.morning': 'morning',
    'dashboard.welcome.time.afternoon': 'afternoon',
    'dashboard.welcome.time.evening': 'evening',
    'dashboard.planNextTrip': 'Ready to plan your next journey?',
    'dashboard.planTripAction': 'Plan My Trip',
    'dashboard.summary.requests': 'Travel Requests',
    'dashboard.summary.quotations': 'Quotations',
    'dashboard.summary.jobs': 'Active Trips',
    'dashboard.summary.messages': 'Unread Messages',
    'dashboard.summary.notifications': 'Notifications',

    'dashboard.action.draft.title': 'Continue your trip',
    'dashboard.action.draft.desc': 'Your draft is not complete yet.',
    'dashboard.action.draft.btn': 'Continue planning',
    'dashboard.action.quote.title': 'New quotations received',
    'dashboard.action.quote.desc': 'Review your new offers from agencies.',
    'dashboard.action.quote.btn': 'View quotations',
    'dashboard.action.job.title': 'You have an active trip',
    'dashboard.action.job.desc': 'Your journey is in progress.',
    'dashboard.action.job.btn': 'View your trip',
    'dashboard.action.empty.title': 'Plan your first trip',
    'dashboard.action.empty.desc': "Tell us where you want to go and we'll help organize the trip.",
    'dashboard.action.empty.btn': 'Plan My Trip',

    'dashboard.section.requests': 'Recent Travel Requests',
    'dashboard.section.quotations': 'Recent Quotations',
    'dashboard.section.jobs': 'Active Trips',
    'dashboard.section.messages': 'Recent Messages',

    'dashboard.empty.requests': 'No requests yet.',
    'dashboard.empty.quotations': 'No quotations yet.',
    'dashboard.empty.jobs': 'No active trips yet.',
    'dashboard.empty.messages': 'No recent messages.',

    // Trip & Quotation workflow
    'trip.package.blue_cruise': 'Blue Cruise',
    'trip.cruiseDuration.title': 'Choose your cruise duration',
    'trip.cruiseDuration.4d_3n': '4 Days / 3 Nights',
    'trip.cruiseDuration.6d_5n': '6 Days / 5 Nights',
    'trip.cruiseDurationRequired': 'Please select a cruise duration.',

    'status.draft': 'Draft',
    'status.submitted': 'Submitted',
    'status.accepted': 'Accepted',
    'status.cancelled': 'Cancelled',
    'status.in_progress': 'In Progress',
    'status.completed': 'Completed',
    'status.declined': 'Declined',
    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.suspended': 'Suspended',
    'status.expired': 'Expired',
    'status.paid': 'Paid',
    'status.unpaid': 'Unpaid',
    'status.matching': 'Matching',
    'status.quoted': 'Quoted',
    'status.all': 'All',

    // Agency Portal
    'agency.coverage.title': 'Service Coverage & Capabilities',
    'agency.coverage.subtitle':
      'Select the regions you operate in and the services your agency provides to receive relevant travel requests.',
    'agency.coverage.operatingAreas': 'Operating Areas / Geographic Coverage',
    'agency.coverage.searchPlaceholder':
      'Search destinations (e.g. Istanbul, Cappadocia, Antalya...)',
    'agency.coverage.selectedAreas': 'Selected Operating Areas',
    'agency.coverage.noAreas':
      'No operating areas selected yet. Add at least one destination to receive matching requests.',
    'agency.coverage.servicesProvided': 'Services Provided',
    'agency.coverage.noServices':
      'No services selected. Select the service capabilities your agency provides.',
    'agency.coverage.save': 'Save Changes',
    'agency.coverage.saving': 'Saving...',
    'agency.coverage.saved': 'Changes Saved',
    'agency.status.title': 'Onboarding Status',
    'agency.status.pending': 'Pending Approval',
    'agency.status.approved': 'Approved & Active',
    'agency.status.suspended': 'Account Suspended',
    'agency.status.rejected': 'Registration Rejected',
    'agency.membership.active': 'Active Membership',
    'agency.membership.inactive': 'Inactive Membership',

    // Messaging & Dynamic Translation
    'chat.sendMessage': 'Send Message',
    'chat.placeholder': 'Type your message...',
    'chat.translate': 'Translate to Turkish',
    'chat.translateEn': 'Translate to English',
    'chat.showOriginal': 'Show Original',
    'chat.translating': 'Translating...',
    'chat.cachedNotice': 'Cached translation',

    // Admin Portal
    'admin.dashboard': 'Overview Dashboard',
    'admin.agencies': 'Agency Approvals',
    'admin.memberships': 'Memberships',
    'admin.plans': 'Membership Plans',
    'admin.commissions': 'Commissions',
    'admin.travelRequests': 'Travel Requests',
    'admin.jobs': 'Jobs',
    'admin.auditLogs': 'Audit Logs',
    'admin.translations': 'Translation Cache & Metrics',

    // Agencies Directory
    'agencies.verifiedIn': 'Verified Travel Agencies in',
    'agencies.licensedIn': 'Licensed local travel operators based in',
    'agencies.readyToPlan': 'ready to plan and execute your trip.',
    'agencies.filter.all': 'All Locations',
    'agencies.filter.turkey': 'Turkey (All)',
    'agencies.filter.turkeyNationwide': 'Turkey (Nationwide)',
    'agencies.filter.istanbul': 'Istanbul',
    'agencies.filter.cappadocia': 'Cappadocia',
    'agencies.filter.cappadociaNevsehir': 'Nevsehir (Cappadocia)',
    'agencies.filter.antalya': 'Antalya',
    'agencies.filter.izmir': 'Izmir',
    'agencies.filter.izmirAegean': 'Izmir (Aegean)',

    // Agency Specialties
    'agency.specialty.culturalTours': 'Cultural Tours',
    'agency.specialty.privateDrivers': 'Private Drivers',
    'agency.specialty.vipTransfers': 'VIP Transfers',
    'agency.specialty.luxuryHotels': 'Luxury Hotels',
    'agency.specialty.coastalRoutes': 'Coastal Routes',
    'agency.specialty.yachtCharters': 'Yacht Charters',
    'agency.specialty.beachResorts': 'Beach Resorts',
    'agency.specialty.familyHolidays': 'Family Holidays',
    'agency.specialty.balloonRides': 'Balloon Rides',
    'agency.specialty.caveHotels': 'Cave Hotels',
    'agency.specialty.trekking': 'Trekking',
    'agency.specialty.photographyTours': 'Photography Tours',
    'agency.specialty.ancientSites': 'Ancient Sites',
    'agency.specialty.wineCulinary': 'Wine & Culinary',
    'agency.specialty.boutiqueEscapes': 'Boutique Escapes',
    'agency.specialty.selfDriveRoutes': 'Self-Drive Routes',

    // Travel Services
    'services.title': 'Travel Services in Turkey',
    'services.subtitle': 'Customizable services delivered by licensed, verified local travel agencies.',
    'services.searchPlaceholder': 'Search travel services (tours, transfer, guide, balloon)...',
    'services.verifiedService': 'Verified Service',
    'services.popularLocations': 'Popular Locations:',
    'services.viewDetails': 'View Details →',
    'services.requestService': 'Request Service',
    'services.noMatch': 'No travel services matched your search.',
    'services.resetSearch': 'Reset Search',
    'services.overview': 'Overview',
    'services.inclusions': 'What Is Included',
    'services.standards': 'Service Standards & Guarantees',
    'services.booking': 'Service Booking',
    'services.bookingSubtitle': 'Select this service when building your custom itinerary to receive competitive quotes from verified local agencies.',
    'services.availableRegions': 'Available in Regions:',
    'services.planWith': 'Plan Trip with {name} →',
    'services.popularFor': 'Popular Destinations for {name}',
    'services.popularForDesc': 'Explore destinations where this service is frequently requested.',
    'services.bookWith': 'Book {name} with Verified Operators',
    'services.bookWithDesc': 'Submit your travel dates and requirements. Matched local operators will submit itemized quotes.',
    'services.service.privateTours.name': 'Private Tours',
    'services.service.privateTours.tagline': 'Bespoke cultural circuits with certified guides and executive transport',
    'services.service.privateTransfer.name': 'Private Transfer',
    'services.service.privateTransfer.tagline': 'Punctual, comfortable door-to-door transportation across Turkey',
    'services.service.minibusWithDriver.name': 'Minibus with Driver',
    'services.service.minibusWithDriver.tagline': 'Chauffeured vans for families, groups, and multi-day travel routes',
    'services.service.guide.name': 'Licensed Guide',
    'services.service.guide.tagline': 'Ministry of Tourism certified experts bringing history and culture to life',
    'services.service.hotAirBalloon.name': 'Hot Air Balloon',
    'services.service.hotAirBalloon.tagline': 'Soar above fairy chimneys, orchards, and volcanic valleys at dawn',

    // Destinations & Country Hub
    'destinations.featuredRegion': 'Featured Region',
    'destinations.turkeyGuide': 'Turkey (Türkiye) Country Guide',
    'destinations.turkeyGuideDesc': 'View national travel essentials, popular holiday circuits, and regional services.',
    'destinations.exploreTurkey': 'Explore Turkey Hub →',
    'destinations.allRegions': 'All Regions',
    'destinations.region.marmara': 'Marmara',
    'destinations.region.centralAnatolia': 'Central Anatolia',
    'destinations.region.mediterranean': 'Mediterranean',
    'destinations.region.aegean': 'Aegean',
    'destinations.region.blackSea': 'Black Sea',
    'country.about': 'About {name}',
    'country.whyTravel': 'Why Travel with QuoteMeTrip in {name}',
    'country.routeFirst': 'Route-First Planning',
    'country.routeFirstDesc': 'Chain multi-city routes across Istanbul, Cappadocia, and Aegean ruins with accurate transit times.',
    'country.licensedOperators': 'Licensed Operators',
    'country.licensedOperatorsDesc': 'Receive quotes only from government-verified Turkish travel agencies.',
    'country.travelEssentials': 'Travel Essentials',
    'country.currency': 'Currency:',
    'country.capital': 'Capital:',
    'country.languages': 'Languages:',
    'country.bestTime': 'Best Time to Visit:',
    'country.gateways': 'Gateways:',
    'country.planTripIn': 'Plan a Trip in {name} →',
    'country.destinationsIn': 'Destinations in {name}',
    'country.destinationsInDesc': 'Select a destination to view local highlights, tours, and travel advice.',
    'country.servicesIn': 'Travel Services in {name}',
    'country.servicesInDesc': 'Professional services provided by verified local operators.',
    'country.guidesIn': 'Travel Guides & Route Advice',
    'country.guidesInDesc': 'Insights and itineraries written by regional travel specialists.',
    'country.readyToVisit': 'Ready to Visit {name}?',
    'country.readyToVisitDesc': 'Build your route across Turkey and receive itemized quotations from verified local agencies.',

    // Plan Trip & Route Engine
    'planTrip.title': 'Plan Your Trip',
    'planTrip.step1': 'Route',
    'planTrip.step2': 'Details',
    'planTrip.step3': 'Day Plan',
    'planTrip.step4': 'Review',
    'route.addDestination': 'Add Destination',
    'route.searchPlaceholder': 'Search city (e.g. Istanbul, Bodrum)...',
    'route.startLocation': '1. Start Location',
    'route.intermediateStop': 'Stop (Intermediate)',
    'route.finalDestination': 'Final Destination',
    'route.add': 'Add',
    'route.selectedDestinations': 'Selected Destinations',
    'route.adjustOrder': 'Use arrows to adjust routing order',
    'route.noStops': 'No destinations added yet',
    'route.noStopsDesc': 'Search your starting point above to begin crafting your personalized road trip.',
    'route.calculating': 'Calculating Google Road Route...',
    'route.needMinStops': 'Add at least 2 destinations to calculate route',
    'route.recalculate': 'Recalculate Route ({count} stops)',
    'route.calculated': 'Route Calculated · Recalculate ({count} stops)',
    'route.calculate': 'Calculate Route ({count} stops)',

    // Agency & Admin Navigation
    'agency.nav.dashboard': 'Dashboard',
    'agency.nav.requests': 'Incoming Requests',
    'agency.nav.quotations': 'My Quotations',
    'agency.nav.messages': 'Messages',
    'agency.nav.jobs': 'Confirmed Jobs',
    'agency.nav.profile': 'Agency Profile',
    'admin.nav.overview': 'OVERVIEW',
    'admin.nav.dashboard': 'Dashboard',
    'admin.nav.agencyPlans': 'AGENCY & PLANS',
    'admin.nav.agencies': 'Agencies',
    'admin.nav.memberships': 'Memberships',
    'admin.nav.membershipPlans': 'Membership Plans',
    'admin.nav.commissions': 'Commissions',
    'admin.nav.marketplace': 'MARKETPLACE',
    'admin.nav.travelRequests': 'Travel Requests',
    'admin.nav.jobs': 'Jobs',
    'admin.nav.broadcasts': 'BROADCASTS',
    'admin.nav.announcements': 'Announcements',
    'admin.nav.security': 'SECURITY',
    'admin.nav.auditLogs': 'Audit Logs',
    'admin.operations': 'QuoteMeTrip Operations',
    'admin.verifiedAdmin': 'Verified System Admin',

    // Admin Dashboard
    'admin.dashboard.greeting': 'Good afternoon, Admin',
    'admin.dashboard.subtitle': 'Monitor agencies, requests, memberships and platform operations across the QuoteMeTrip marketplace.',
    'admin.dashboard.totalAgencies': 'Total Agencies',
    'admin.dashboard.pending': 'Pending: {count}',
    'admin.dashboard.approved': 'Approved: {count}',
    'admin.dashboard.activeMemberships': 'Active Memberships',
    'admin.dashboard.expired': 'Expired: {count}',
    'admin.dashboard.travelRequests': 'Travel Requests',
    'admin.dashboard.activeJobs': 'Active Jobs: {count}',
    'admin.dashboard.completed': 'Completed: {count}',
    'admin.dashboard.totalCommissions': 'Total Commissions',
    'admin.dashboard.paid': 'Paid: ${amount}',
    'admin.dashboard.pendingCommission': 'Pending: ${amount}',
    'admin.dashboard.attentionNeeded': 'Operational Attention Needed',
    'admin.dashboard.agencyAlert': '{count} agency registrations waiting for document verification and approval.',
    'admin.dashboard.reviewAgencies': 'Review Agencies',
    'admin.dashboard.allAgenciesReviewed': 'All agency applications have been reviewed.',
    'admin.dashboard.membershipAlert': '{count} membership payments pending manual admin confirmation.',
    'admin.dashboard.confirmPayments': 'Confirm Payments',
    'admin.dashboard.errorLoading': 'Unable to load dashboard metrics.',
    'admin.dashboard.retry': 'Retry Connection',

    // Admin Common
    'admin.common.view': 'View',
    'admin.common.manage': 'Manage',
    'admin.common.requests': 'Requests',
    'admin.common.details': 'Details',
    'admin.common.edit': 'Edit',
    'admin.common.delete': 'Delete',
    'admin.common.save': 'Save',
    'admin.common.cancel': 'Cancel',
    'admin.common.confirm': 'Confirm',
    'admin.common.close': 'Close',
    'admin.common.refresh': 'Refresh',
    'admin.common.search': 'Search',
    'admin.common.filter': 'Filter',
    'admin.common.status': 'Status',
    'admin.common.actions': 'Actions',
    'admin.common.previous': 'Previous',
    'admin.common.next': 'Next',
    'admin.common.pageOf': 'Page {page} of {totalPages} ({totalItems} records)',
    'admin.common.pageOfAgencies': 'Page {page} of {totalPages} ({totalItems} agencies)',
    'admin.common.loading': 'Loading...',
    'admin.common.error': 'Error',
    'admin.common.tryAgain': 'Try Again',
    'admin.common.success': 'Success',
    'admin.common.optional': 'Optional',
    'admin.common.allStatuses': 'All Statuses',
    'admin.common.all': 'All',
    'admin.common.profile': 'Profile',
    'admin.common.signOut': 'Sign out',
    'admin.common.signedInAs': 'Signed in as {email}',
    'admin.common.notifications': 'Notifications',

    // Admin Agencies Directory & Approval
    'admin.agencies.eyebrow': 'Agency Directory & Compliance',
    'admin.agencies.title': 'Agency Directory & Approval',
    'admin.agencies.subtitle': 'Manage agency onboardings, document verification compliance, and operational account statuses.',
    'admin.agencies.totalAgencies': 'Total Agencies',
    'admin.agencies.pendingReview': 'Pending Review',
    'admin.agencies.approvedActive': 'Approved & Active',
    'admin.agencies.suspendedInactive': 'Suspended / Inactive',
    'admin.agencies.searchPlaceholder': 'Search by agency name, email, city, country...',
    'admin.agencies.colAgency': 'Agency',
    'admin.agencies.colContact': 'Contact / Email',
    'admin.agencies.colLocation': 'Location',
    'admin.agencies.colStatus': 'Status',
    'admin.agencies.colDocs': 'Docs',
    'admin.agencies.colMemberships': 'Memberships',
    'admin.agencies.colActions': 'Actions',
    'admin.agencies.docCount': '{count} doc(s)',
    'admin.agencies.membershipCount': '{count} record(s)',
    'admin.agencies.approve': 'Approve',
    'admin.agencies.reject': 'Reject',
    'admin.agencies.suspend': 'Suspend',
    'admin.agencies.reactivate': 'Reactivate',
    'admin.agencies.emptyTitle': 'No agencies found',
    'admin.agencies.emptyFiltered': 'No registered travel agencies match your search and filter criteria.',
    'admin.agencies.emptyAll': 'There are currently no agencies registered on the QuoteMeTrip platform.',
    'admin.agencies.confirmModalTitle': 'Confirm {type}',
    'admin.agencies.confirmModalMsg': 'Are you sure you want to {type} the agency {name}?',
    'admin.agencies.reasonLabel': 'Reason / Administrative Note (Optional):',
    'admin.agencies.reasonPlaceholder': 'Enter reason for this action...',
    'admin.agencies.updateSuccess': 'Agency "{name}" successfully updated to {type}d.',
    'admin.agencies.actionFailed': 'Action failed: {message}',
    'admin.agencies.loadingRecords': 'Loading agency records...',
    'admin.agencies.failedToLoad': 'Failed to load agencies',
    'admin.agencies.processing': 'Processing...',

    // Admin Agency Detail & Verification
    'admin.agencyDetail.backToAgencies': 'Back to Agency Directory',
    'admin.agencyDetail.registeredOn': 'Registered on {date} — User ID #{id}',
    'admin.agencyDetail.overviewTab': 'Overview & Contact',
    'admin.agencyDetail.documentsTab': 'Compliance Documents ({count})',
    'admin.agencyDetail.membershipsTab': 'Assigned Memberships ({count})',
    'admin.agencyDetail.auditTab': 'Audit History',
    'admin.agencyDetail.contactInfo': 'Contact & Identity Information',
    'admin.agencyDetail.businessDetails': 'Business & Legal Details',
    'admin.agencyDetail.contactPerson': 'Contact Person',
    'admin.agencyDetail.email': 'Business Email',
    'admin.agencyDetail.phone': 'Phone Number',
    'admin.agencyDetail.website': 'Website',
    'admin.agencyDetail.address': 'Full Address',
    'admin.agencyDetail.city': 'City',
    'admin.agencyDetail.country': 'Country',
    'admin.agencyDetail.tursabLicense': 'TÜRSAB / License Number',
    'admin.agencyDetail.taxNumber': 'Tax ID / Number',
    'admin.agencyDetail.taxOffice': 'Tax Office',
    'admin.agencyDetail.companyTitle': 'Legal Company Title',
    'admin.agencyDetail.bio': 'Agency Description / Bio',
    'admin.agencyDetail.verifyDocument': 'Verify Document',
    'admin.agencyDetail.rejectDocument': 'Reject Document',
    'admin.agencyDetail.verified': 'Verified',
    'admin.agencyDetail.rejected': 'Rejected',
    'admin.agencyDetail.viewDocument': 'View Document',
    'admin.agencyDetail.noDocuments': 'No compliance documents uploaded yet.',
    'admin.agencyDetail.assignMembership': 'Assign Membership Plan',
    'admin.agencyDetail.planSelectLabel': 'Select Plan',
    'admin.agencyDetail.paymentRefLabel': 'Payment Reference / Receipt ID',
    'admin.agencyDetail.assignBtn': 'Assign Plan',
    'admin.agencyDetail.notFound': 'Agency not found',
    'admin.agencyDetail.notFoundDesc': 'The requested agency record does not exist or has been removed.',
    'admin.agencyDetail.docVerifySuccess': 'Document verified and approved.',
    'admin.agencyDetail.docRejectSuccess': 'Document rejected with administrative note.',
    'admin.agencyDetail.memAssignSuccess': 'Membership plan successfully assigned to agency.',
    'admin.agencyDetail.rejectDocTitle': 'Reject Compliance Document',
    'admin.agencyDetail.rejectDocDesc': 'Provide an administrative note explaining why this document does not meet compliance standards:',
    'admin.agencyDetail.rejectDocNotePlaceholder': 'Explain required corrections or missing details...',

    // Admin Memberships Management
    'admin.memberships.title': 'Agency Membership Lifecycle & Payments',
    'admin.memberships.subtitle': 'Manage agency subscription tiers, verify manual bank payments, and control matching status.',
    'admin.memberships.colAgency': 'Agency',
    'admin.memberships.colPlan': 'Plan',
    'admin.memberships.colStatus': 'Status',
    'admin.memberships.colPrice': 'Price',
    'admin.memberships.colDates': 'Validity Period',
    'admin.memberships.colPaymentRef': 'Payment Ref',
    'admin.memberships.colActions': 'Actions',
    'admin.memberships.confirmPaymentBtn': 'Confirm Payment',
    'admin.memberships.suspendBtn': 'Suspend',
    'admin.memberships.reactivateBtn': 'Reactivate',
    'admin.memberships.confirmPaymentTitle': 'Confirm Membership Payment',
    'admin.memberships.confirmPaymentDesc': 'Record and confirm manual payment for {agency} ({plan}). This will activate membership immediately.',
    'admin.memberships.paymentRefLabel': 'Payment Reference / Bank Transaction ID:',
    'admin.memberships.paymentRefPlaceholder': 'e.g. TR-BANK-987654321',
    'admin.memberships.adminNotesLabel': 'Administrative Notes (Optional):',
    'admin.memberships.adminNotesPlaceholder': 'Payment verified via bank transfer on...',
    'admin.memberships.paymentSuccess': 'Payment confirmed successfully.',
    'admin.memberships.suspendTitle': 'Suspend Agency Membership',
    'admin.memberships.suspendMessage': 'Are you sure you want to suspend this agency membership? The agency will lose matching eligibility while suspended.',
    'admin.memberships.suspendConfirmText': 'Suspend Membership',
    'admin.memberships.suspendSuccess': 'Membership suspended successfully.',
    'admin.memberships.reactivateTitle': 'Reactivate Agency Membership',
    'admin.memberships.reactivateMessage': 'Reactivate this agency membership? The agency will regain active matching eligibility.',
    'admin.memberships.reactivateConfirmText': 'Reactivate Membership',
    'admin.memberships.reactivateSuccess': 'Membership reactivated successfully.',
    'admin.memberships.empty': 'No membership records found matching current criteria.',
    'admin.memberships.loading': 'Loading membership records...',

    // Admin Membership Plans
    'admin.membershipPlans.title': 'Membership Plans & Tiers',
    'admin.membershipPlans.subtitle': 'Configure subscription tiers, lead quotas, commission structures, and agency marketplace permissions.',
    'admin.membershipPlans.createPlan': 'Create New Plan',
    'admin.membershipPlans.editPlan': 'Edit Plan',
    'admin.membershipPlans.planName': 'Plan Name',
    'admin.membershipPlans.planCode': 'Plan Code',
    'admin.membershipPlans.price': 'Price (TRY)',
    'admin.membershipPlans.duration': 'Duration (Days)',
    'admin.membershipPlans.quoteLimit': 'Quote Limit / Month',
    'admin.membershipPlans.unlimited': 'Unlimited',
    'admin.membershipPlans.commissionRate': 'Commission Rate (%)',
    'admin.membershipPlans.features': 'Features & Inclusions (one per line)',
    'admin.membershipPlans.active': 'Active',
    'admin.membershipPlans.inactive': 'Inactive',
    'admin.membershipPlans.activate': 'Activate',
    'admin.membershipPlans.deactivate': 'Deactivate',
    'admin.membershipPlans.deleteTitle': 'Delete Membership Plan',
    'admin.membershipPlans.deleteMessage':
      'Are you sure you want to permanently delete the membership plan "{name}"? If agencies are currently subscribed to this plan, deletion is restricted and you should deactivate it instead.',
    'admin.membershipPlans.deactivateInstead': 'Deactivate Plan Instead',
    'admin.membershipPlans.savePlan': 'Save Plan',
    'admin.membershipPlans.planDeleted': 'Membership plan "{name}" has been deleted.',
    'admin.membershipPlans.planCreated': 'Membership plan "{name}" created successfully.',
    'admin.membershipPlans.planUpdated': 'Membership plan "{name}" updated successfully.',
    'admin.membershipPlans.planStatusChanged': 'Membership plan "{name}" is now {status}.',
    'admin.membershipPlans.loading': 'Loading membership plans...',
    'admin.membershipPlans.empty': 'No membership plans configured yet.',
    'admin.membershipPlans.emptyDesc': 'Click "Create New Plan" to define your first subscription tier.',
    'admin.membershipPlans.slug': 'Slug',
    'admin.membershipPlans.description': 'Description',
    'admin.membershipPlans.days': 'days',
    'admin.membershipPlans.deletePlan': 'Delete Plan',
    'admin.membershipPlans.saving': 'Saving...',

    // Admin Commissions
    'admin.commissions.title': 'Commission Tracking',
    'admin.commissions.subtitle': 'Track platform commission earnings from accepted marketplace jobs.',
    'admin.commissions.totalEarned': 'Total Earned',
    'admin.commissions.pendingAmount': 'Pending',
    'admin.commissions.paidAmount': 'Paid',
    'admin.commissions.confirmedAmount': 'Confirmed',
    'admin.commissions.paidOut': 'Paid Out',
    'admin.commissions.allStatuses': 'All Commission Statuses',
    'admin.commissions.confirmBtn': 'Confirm',
    'admin.commissions.colCommissionId': 'Commission ID',
    'admin.commissions.colJobQuotation': 'Job / Quotation',
    'admin.commissions.colJobId': 'Job ID',
    'admin.commissions.colAgency': 'Agency',
    'admin.commissions.colTraveller': 'Traveller',
    'admin.commissions.colBookingAmount': 'Booking Amount',
    'admin.commissions.colRate': 'Rate',
    'admin.commissions.colCommission': 'Commission',
    'admin.commissions.colStatus': 'Status',
    'admin.commissions.colDate': 'Created',
    'admin.commissions.markAsPaid': 'Mark as Paid',
    'admin.commissions.loading': 'Loading commission records...',
    'admin.commissions.empty': 'No commission records found.',

    // Admin Travel Requests
    'admin.travelRequests.title': 'Travel Requests (Operational Visibility)',
    'admin.travelRequests.subtitle': 'Read-only operational inspection of traveller itineraries and submitted requests.',
    'admin.travelRequests.allStatuses': 'All Request Statuses',
    'admin.travelRequests.colRequestId': 'Request ID',
    'admin.travelRequests.colTraveller': 'Traveller',
    'admin.travelRequests.colDestination': 'Route / Destinations',
    'admin.travelRequests.colDates': 'Travel Dates',
    'admin.travelRequests.colPartySize': 'Party Size',
    'admin.travelRequests.colPackage': 'Package',
    'admin.travelRequests.colQuotes': 'Quotations',
    'admin.travelRequests.colStatus': 'Status',
    'admin.travelRequests.colCreatedAt': 'Submitted At',
    'admin.travelRequests.travellerCount': '{count} traveller(s)',
    'admin.travelRequests.quotesCount': '{count} quote(s)',
    'admin.travelRequests.noRequests': 'No travel requests found.',
    'admin.travelRequests.loadingRequests': 'Loading travel requests...',

    // Admin Jobs
    'admin.jobs.title': 'Marketplace Jobs (Operational Visibility)',
    'admin.jobs.subtitle': 'Read-only operational monitoring of accepted marketplace bookings.',
    'admin.jobs.allStatuses': 'All Job Statuses',
    'admin.jobs.colJobId': 'Job ID',
    'admin.jobs.colAgency': 'Agency',
    'admin.jobs.colTraveller': 'Traveller',
    'admin.jobs.colPrice': 'Agreed Price',
    'admin.jobs.colQuotationTotal': 'Quotation Total',
    'admin.jobs.colStatus': 'Status',
    'admin.jobs.colDate': 'Accepted Date',
    'admin.jobs.noJobs': 'No jobs found matching the selected filter.',
    'admin.jobs.loadingJobs': 'Loading jobs...',

    // Admin Audit Logs
    'admin.auditLogs.title': 'Administrative Audit Logs',
    'admin.auditLogs.subtitle': 'Immutable compliance record of admin state changes, approvals, and overrides.',
    'admin.auditLogs.filterAction': 'Filter by action (e.g. agency.approved)...',
    'admin.auditLogs.allEntities': 'All Entity Types',
    'admin.auditLogs.colTimestamp': 'Timestamp',
    'admin.auditLogs.colAdmin': 'Admin / Actor',
    'admin.auditLogs.colAction': 'Action',
    'admin.auditLogs.colEntity': 'Entity',
    'admin.auditLogs.colDetails': 'Details / Payload',
    'admin.auditLogs.noLogs': 'No audit log entries found.',
    'admin.auditLogs.loadingLogs': 'Loading audit logs...',
    'admin.auditLogs.inspectPayload': 'Inspect Payload',
    'admin.auditLogs.modalTitle': 'Audit Log Details',
    'admin.auditLogs.colActor': 'Actor',
    'admin.auditLogs.colTargetEntity': 'Target Entity',
    'admin.auditLogs.colIpAddress': 'IP Address',
    'admin.auditLogs.colStateDiff': 'State Diff',
    'admin.auditLogs.inspectJson': 'Inspect JSON',
    'admin.auditLogs.beforeState': 'Before State:',
    'admin.auditLogs.afterState': 'After State:',
    'admin.auditLogs.systemPublic': 'System / Public',
    'admin.auditLogs.entityAgency': 'Agency',
    'admin.auditLogs.entityDocument': 'Document',
    'admin.auditLogs.entityMembership': 'Membership',
    'admin.auditLogs.entityCommission': 'Commission',
    'admin.auditLogs.entityMembershipPlan': 'Membership Plan',

    // Admin Auth
    'admin.auth.brandBadge': 'ADMIN PORTAL',
    'admin.auth.loginTitle': 'Admin Operations Sign In',
    'admin.auth.loginSubtitle': 'Restricted workspace. Authorized personnel only.',
    'admin.auth.emailLabel': 'Admin email',
    'admin.auth.passwordLabel': 'Password',
    'admin.auth.emailPlaceholder': 'admin@quotemetrip.com',
    'admin.auth.signInButton': 'Sign in to Admin Console',
    'admin.auth.securityNotice': 'Encrypted administrative session. System activity is monitored and logged for security audits.',
    'admin.auth.validEmailError': 'Enter a valid email address.',
    'admin.auth.passwordRequiredError': 'Enter your password.',

    // Admin Announcements
    'admin.announcements.eyebrow': 'Communications & Broadcasting',
    'admin.announcements.title': 'Announcement Center',
    'admin.announcements.subtitle': 'Broadcast in-app notices, maintenance alerts, and push updates directly to travellers and travel agencies.',
    'admin.announcements.newAnnouncement': 'New Announcement',
    'admin.announcements.totalBroadcasts': 'Total Broadcasts',
    'admin.announcements.activePublished': 'Active / Published',
    'admin.announcements.travellerCampaigns': 'Traveller Campaigns',
    'admin.announcements.agencyCampaigns': 'Agency Campaigns',
    'admin.announcements.searchPlaceholder': 'Filter by title, keywords...',
    'admin.announcements.audienceAll': 'Audience: All',
    'admin.announcements.audienceTravellers': 'Travellers Only',
    'admin.announcements.audienceAgencies': 'Agencies Only',
    'admin.announcements.audienceBoth': 'Both Audiences',
    'admin.announcements.statusAll': 'Status: All',
    'admin.announcements.statusPublished': 'Published',
    'admin.announcements.statusDraft': 'Draft',
    'admin.announcements.statusWithdrawn': 'Withdrawn',
    'admin.announcements.statusExpired': 'Expired',
    'admin.announcements.loading': 'Loading announcements...',
    'admin.announcements.emptyTitle': 'No announcements found',
    'admin.announcements.emptyDesc': 'No broadcast notices match your active filters. Try clearing filters.',
    'admin.announcements.emptyAllDesc': 'Create a new broadcast to send system news, urgent travel updates, or maintenance notices to travellers and agencies.',
    'admin.announcements.colType': 'Type',
    'admin.announcements.colContent': 'Announcement Content',
    'admin.announcements.colTarget': 'Target',
    'admin.announcements.colStatus': 'Status',
    'admin.announcements.colPublished': 'Published',
    'admin.announcements.colStats': 'Stats',
    'admin.announcements.colActions': 'Actions',
    'admin.announcements.notPublished': 'Not published',
    'admin.announcements.viewStats': 'View',
    'admin.announcements.previewTitle': 'Preview Notification',
    'admin.announcements.publishTitle': 'Publish Broadcast',
    'admin.announcements.withdrawTitle': 'Withdraw Broadcast',
    'admin.announcements.editTitle': 'Edit Announcement',
    'admin.announcements.deleteTitle': 'Delete Announcement',
    'admin.announcements.pageOf': 'Page {page} of {totalPages} ({totalItems} broadcasts)',

    // Route Planning Workspace
    'route.step1Header': 'Step 1: Design & Calculate Road Route',
    'route.heading': 'Where would you like to travel?',
    'route.clearRoute': 'Clear Route',
    'route.subtitle':
      'Add your starting city, intermediate scenic stops, and final destination. Our Google Maps routing engine calculates real driving distance, estimated highway travel duration, and recommended sightseeing days.',
    'route.addDestination': 'Add Destination',
    'route.placesAutocomplete': 'Google Places Autocomplete',
    'route.searchPlaceholder': 'Search city (e.g. Istanbul, Bodrum)...',
    'route.startLocationNum': '1. Start Location',
    'route.startLocation': 'Start Location',
    'route.intermediateStop': 'Stop (Intermediate)',
    'route.finalDestination': 'Final Destination',
    'route.add': 'Add',
    'route.selectFromSuggestions': 'Please search and select a destination from suggestions.',
    'route.selectedDestinations': 'Selected Destinations ({count})',
    'route.adjustOrder': 'Use arrows to adjust routing order',
    'route.noDestinations': 'No destinations added yet',
    'route.noDestinationsDesc':
      'Search your starting point above to begin crafting your personalized road trip.',
    'route.badgeStart': 'START',
    'route.badgeStop': 'STOP',
    'route.badgeFinal': 'FINAL',
    'route.calculating': 'Calculating Google Road Route...',
    'route.minStops': 'Add at least 2 destinations to calculate route',
    'route.recalculate': 'Recalculate Route ({count} stops)',
    'route.calculated': 'Route Calculated · Recalculate ({count} stops)',
    'route.calculate': 'Calculate Route ({count} stops)',
    'route.journeySummary': 'Road Journey Summary',
    'route.airJourneySummary': 'Air Journey Summary (Great-Circle)',
    'route.walkJourneySummary': 'Walking Journey Summary',
    'route.cycleJourneySummary': 'Cycling Journey Summary',
    'route.motoJourneySummary': 'Motorcycle Journey Summary',
    'route.transitJourneySummary': 'Transit Journey Summary',
    'route.modeRouteCalculated': '{mode} Route Calculated',
    'route.hours': '{count} hr',
    'route.hoursPlural': '{count} hrs',
    'route.mins': '{count} min',
    'route.minsPlural': '{count} mins',
    'route.updateNeeded': 'Update Needed',
    'route.routesCalculated': 'Google Routes Calculated',
    'route.stopsConfigured': 'Stops Configured',
    'route.roadDistance': 'Road Distance',
    'route.drivingTime': 'Driving Time',
    'route.destinations': 'Destinations',
    'route.stopsCount': 'Stops',
    'route.recommended': 'Recommended',
    'route.staleWarning': 'Stops changed — recalculate to refresh road route and metrics.',
    'route.recalculateBtn': 'Recalculate',
    'route.legBreakdown': 'Detailed Leg Breakdown ({count} segments)',

    // About Page Content
    'about.breadcrumbs': 'About Us',
    'about.mission':
      "QuoteMeTrip was built to solve a fundamental challenge in multi-stop travel planning: bridging the gap between a traveller's unique route vision and the local expertise required to execute it seamlessly without overpriced intermediaries.",
    'about.howWeHelp': 'How We Help Travellers',
    'about.feature1Title': 'Route-First Itinerary Builder',
    'about.feature1Desc':
      'Map out custom multi-stop itineraries across Istanbul, Cappadocia, and the Turquoise Coast with automatic distance calculation and recommended day allocation.',
    'about.feature2Title': 'Competitive Agency Quotations',
    'about.feature2Desc':
      'Receive itemized offers directly from licensed local travel operators tailored to your specific travel requirements and budget.',
    'about.feature3Title': 'Secure Direct Messaging',
    'about.feature3Desc':
      'Chat directly with agency partners to adjust line items, refine itineraries, and confirm travel arrangements.',
    'about.feature4Title': 'Zero Platform Fees for Travellers',
    'about.feature4Desc':
      'Travellers never pay booking fees to QuoteMeTrip. You pay your chosen agency directly via their secure invoice.',

    // Agency Detail Page
    'agency.about': 'About the Agency',
    'agency.specialtiesServices': 'Specialties & Services',
    'agency.spokenLanguages': 'Spoken Languages',
    'agency.preAcceptanceNotice':
      'Direct contact details become available after accepting a quotation from this agency.',
    'agency.planTripRequestQuote': 'Plan Trip & Request Quotation →',
    'agency.readyToRequest': 'Ready to Request a Quotation?',
    'agency.readyToRequestSubtitle':
      'Build your route now and matched agencies will submit custom offers.',
    'agency.notFound': 'Agency Not Found',
    'agency.notFoundDesc': 'The requested agency profile does not exist.',
    'agency.backToAgencies': 'Back to Agencies',

    // Destination Detail Page
    'destination.travelInfo': 'Travel Information',
    'destination.regionLabel': 'Region:',
    'destination.countryLabel': 'Country:',
    'destination.bestTimeLabel': 'Best Time to Visit:',
    'destination.availableServices': 'Available Travel Services in {name}',
    'destination.availableServicesDesc':
      'Add verified local services to your custom itinerary for {name}.',
    'destinations.ctaSubtitle':
      'Build your route including this destination and get custom agency quotations.',

    // Route Planner & Trip Builder (Workstream 2)
    'route.step1Header': 'Step 1: Design & Calculate Road Route',
    'route.heading': 'Where would you like to travel?',
    'route.clearRoute': 'Clear Route',
    'route.subtitle': 'Add your starting city, intermediate scenic stops, and final destination. Our Google Maps routing engine calculates real driving distance, estimated highway travel duration, and recommended sightseeing days.',
    'route.travelMode': 'Travel Mode',
    'route.modeDrive': 'Drive',
    'route.modeDriveHint': 'Highway road route',
    'route.modeMoto': 'Motorcycle',
    'route.modeMotoHint': 'Two-wheeler routing',
    'route.modeWalk': 'Walk',
    'route.modeWalkHint': 'Pedestrian route',
    'route.modeCycle': 'Bicycle',
    'route.modeCycleHint': 'Cycling path',
    'route.modeTransit': 'Transit',
    'route.modeTransitHint': 'Public transit (2 stops)',
    'route.modeAir': 'Air',
    'route.modeAirHint': 'Straight-line great-circle',
    'route.addDestination': 'Add Destination',
    'route.placesAutocomplete': 'Google Places Autocomplete',
    'route.searchPlaceholder': 'Search city (e.g. Istanbul, Bodrum)...',
    'route.startLocationNum': '1. Start Location',
    'route.intermediateStop': 'Stop (Intermediate)',
    'route.finalDestination': 'Final Destination',
    'route.startLocation': 'Start Location',
    'route.add': 'Add',
    'route.selectFromSuggestions': 'Please search and select a destination from suggestions.',
    'route.selectedDestinations': 'Selected Destinations ({count})',
    'route.adjustOrder': 'Use arrows to adjust routing order',
    'route.noDestinations': 'No destinations added yet',
    'route.noDestinationsDesc': 'Search your starting point above to begin crafting your personalized road trip.',
    'route.badgeStart': 'START',
    'route.badgeFinal': 'FINAL',
    'route.badgeStop': 'STOP',
    'route.calculatingAir': 'Calculating Great-Circle Air Route...',
    'route.calculatingMode': 'Calculating Google {mode} Route...',
    'route.minStops': 'Add at least 2 destinations to calculate route',
    'route.recalculate': 'Recalculate Route ({count} stops)',
    'route.calculated': 'Route Calculated · Recalculate ({count} stops)',
    'route.calculate': 'Calculate Route ({count} stops)',
    'route.continueToStep2': 'Continue to Trip Details (Step 2) →',
    'route.airRoutePreview': 'Great-Circle Air Route Preview',
    'route.roadRoutePreview': 'Google Maps Route Preview ({mode})',
    'route.geodesic': 'Geodesic Great-Circle',
    'route.interactiveRoad': 'Interactive Road Geometry',
    'route.roadDistance': 'Road Distance',
    'route.drivingTime': 'Driving Time',
    'route.airDistance': 'Straight-Line Air Distance',
    'route.airDuration': 'Flight Duration',
    'route.walkDistance': 'Walking Distance',
    'route.walkDuration': 'Walking Time',
    'route.cycleDistance': 'Cycling Distance',
    'route.cycleDuration': 'Cycling Time',
    'route.motoDistance': 'Motorcycle Distance',
    'route.motoDuration': 'Riding Time',
    'route.transitDistance': 'Transit Distance',
    'route.transitDuration': 'Transit Duration',
    'route.notApplicable': 'N/A (Great-Circle)',
    'route.destinations': 'Destinations',
    'route.stopsCount': '{count} Stops',
    'route.recommendedDays': 'Recommended',
    'route.daysCount': '{count} Days',
    'route.detailedLegs': 'Detailed Route Legs ({count} segments)',
    'route.summaryAirNotice': 'Air mode shows straight-line great-circle distance between destinations. Actual flight paths, airlines, and schedules vary.',

    // Admin Announcements & Notifications (Workstream 3)
    'announcements.title': 'Announcement Center',
    'announcements.subtitle': 'Broadcast notices, updates, and maintenance alerts to travellers and agencies.',
    'announcements.create': 'New Announcement',
    'announcements.targetAudience': 'Target Audience',
    'announcements.audienceAll': 'All Users (Travellers & Agencies)',
    'announcements.audienceTravellers': 'Travellers Only',
    'announcements.audienceAgencies': 'Agencies Only',
    'announcements.typeGeneral': 'General Notice',
    'announcements.typeInfo': 'Information',
    'announcements.typeMaintenance': 'System Maintenance',
    'announcements.typeImportant': 'Important Notice',
    'announcements.typeUrgent': 'Urgent Broadcast',
    'announcements.publish': 'Publish Broadcast',
    'announcements.withdraw': 'Withdraw Announcement',
    'announcements.confirmPublish': 'Confirm Broadcast Publication',
    'announcements.publishedSuccess': 'Announcement published and broadcast to recipients.',
    'announcements.withdrawnSuccess': 'Announcement withdrawn successfully.',
    'announcements.statsDelivered': 'Delivered',
    'announcements.statsRead': 'Read',
    'announcements.statsRate': 'Read Rate',
    'announcements.actionLink': 'Action Link',
    'announcements.expiryDate': 'Expiry Date',
    'announcements.detailModalTitle': 'Announcement Details',
    'announcements.publishedAt': 'Published',
    'announcements.expiresOn': 'Expires',
    'announcements.status': 'Status',
    'announcements.read': 'Read',
    'announcements.unread': 'Unread',
    'announcements.close': 'Close',
    'announcements.actionButton': 'Open Action Link',
    'announcements.loading': 'Loading announcement...',
    'announcements.errorLoading': 'Unable to load announcement details.',
    'announcements.notFound': 'Announcement not found or no longer available.',
    'announcements.priority': 'Priority',
  },

  tr: {
    // Navigation & Header
    'header.home': 'Anasayfa',
    'header.dashboard': 'Panel',
    'header.destinations': 'Destinasyonlar',
    'header.travelServices': 'Seyahat Hizmetleri',
    'header.travelGuide': 'Gezi Rehberi',
    'header.travelGuides': 'Gezi Rehberleri',
    'header.agencies': 'Acenteler',
    'header.howItWorks': 'Nasıl Çalışır',
    'header.about': 'Hakkımızda',
    'header.aboutUs': 'Hakkımızda',
    'header.contact': 'İletişim',
    'header.login': 'Giriş Yap',
    'header.register': 'Kayıt Ol',
    'header.planTrip': 'Tatilini Planla',
    'header.myTrips': 'Seyahatlerim',
    'header.profile': 'Profilim',
    'header.signOut': 'Çıkış Yap',
    'header.notifications': 'Bildirimler',

    // Home Hero & Search
    'home.hero.title': 'KUSURSUZ TATİLİNİ PLANLA',
    'home.hero.subtitle':
      'Destinasyonları keşfet. Rota ve seyahat isteklerini belirle. Onaylı acentelerden teklif al.',
    'home.hero.cta': 'Tatilini Planla',
    'home.hero.eyebrow': 'Gün gün tatil planı · yerel acenteler',
    'home.hero.headline1': 'Tek bir talep.',
    'home.hero.headline2': 'Çoklu seyahat teklifi.',
    'home.hero.lead':
      'Seyahatinizin her gününü planlayın — tarihler, destinasyonlar, oteller, rehberler ve aktiviteler. Onaylı yerel acenteler karşılaştırmanız için tekliflerini iletsin.',

    'home.search.country': 'Ülke',
    'home.search.startDate': 'Başlangıç Tarihi',
    'home.search.duration': 'Süre',
    'home.search.days': 'gün',
    'home.search.travellers': 'Kişi Sayısı',
    'home.search.people': 'kişi',
    'home.search.scope': 'Hizmet Kapsamı',
    'home.search.planButton': 'Tatilimi Planla',
    'home.search.getQuotes': 'Ücretsiz Teklif Al',
    'home.search.chooseDates': 'Tarih seçin',
    'home.search.flexibleDates': 'Tarihlerim esnek',
    'home.search.suggestRoute': 'Acenteler rota önersin',
    'home.search.howItWorks': 'Nasıl çalışır?',

    'home.trust.verified': 'Onaylı acenteler',
    'home.trust.verifiedDesc': 'Ekibimizce incelenmiş belgeler',
    'home.trust.freeRequest': 'Ücretsiz talep',
    'home.trust.freeRequestDesc': 'Gezginler için sıfır komisyon',
    'home.trust.compareOffers': 'Teklifleri karşılaştır',
    'home.trust.compareOffersDesc': 'Fiyat, hizmetler, değerlendirmeler',
    'home.trust.payDirect': 'Acenteye doğrudan öde',
    'home.trust.payDirectDesc': 'Acentenin kendi koşullarıyla',
    'home.trust.support': 'Destek',
    'home.trust.supportDesc': 'Gerektiğinde yanınızdayız',

    'home.routes.title': 'Popüler Seyahat Rotaları',
    'home.routes.subtitle': 'Yerel uzmanlar tarafından özenle hazırlanan çok günlük rota önerileri.',
    'home.routes.viewAll': 'Tüm Rotaları İncele',

    'home.destinations.title': 'Popüler Destinasyonlar',
    'home.destinations.subtitle':
      'Türkiye’nin en gözde seyahat rotalarını ve kültürel zenginliklerini keşfedin.',
    'home.destinations.viewAll': 'Tüm Destinasyonları İncele',

    'home.howItWorks.title': 'QuoteMeTrip Nasıl Çalışır?',
    'home.howItWorks.subtitle': 'Hayalinizdeki tatile ulaşmak için 3 kolay adım',
    'home.howItWorks.learnMore': 'Daha fazla bilgi →',
    'home.howItWorks.step1Title': '01. Rotanı Belirle',
    'home.howItWorks.step1Desc':
      'Başlangıç, ara durak ve varış noktalarını interaktif rota aracıyla seç.',
    'home.howItWorks.step2Title': '02. İsteklerini Ekle',
    'home.howItWorks.step2Desc': 'Otel sınıfı, araç ve rehber gibi seyahat tercihlerini bize ilet.',
    'home.howItWorks.step3Title': '03. Acentelerden Teklif Al',
    'home.howItWorks.step3Desc':
      'Onaylı yerel seyahat acenteleri rotana özel detaylı fiyat teklifleri hazırlasın.',
    'home.howItWorks.step4Title': '04. Karşılaştır & Seç',
    'home.howItWorks.step4Desc':
      'Acentelerle mesajlaş, kalem kalem fiyatları karşılaştır, teklifi kabul et.',
    'home.howItWorks.step1Badge': '1. ADIM · 5 DAKİKA',
    'home.howItWorks.step2Badge': '2. ADIM · 24–48 SAAT',
    'home.howItWorks.step3Badge': '3. ADIM · AYNI GÜN',
    'home.howItWorks.card1Title': 'Rotanızı gün gün oluşturun',
    'home.howItWorks.card1Desc':
      'Türkiye’yi seçin, her gün için tarih ve destinasyon belirleyin. Otel sınıfı, araç ve turları özelleştirin — veya acentelerin en uygun rotayı önermesini seçin.',
    'home.howItWorks.card2Title': 'Yerel acentelerden teklifler alın',
    'home.howItWorks.card2Desc':
      'Rotanız yalnızca Türkiye’deki lisanslı ve onaylı seyahat acentelerine iletilir. Acenteler toplam maliyeti hesaplayıp kalem kalem detaylandırılmış teklifler sunar.',
    'home.howItWorks.card3Title': 'Anlaşın, doğrudan acenteye ödeyin, onay alın',
    'home.howItWorks.card3Desc':
      'Beğendiğiniz teklifi kabul edin. Acente resmi güvenli ödeme linkini veya banka faturasını iletir. Aracı olmadan doğrudan acenteye ödeme yaparsınız.',
    'home.howItWorks.step1Tick1': 'Durakları dilediğiniz gibi ekleyin, çıkarın ve sıralayın',
    'home.howItWorks.step1Tick2': 'Her gün için: aktivite, rehber, otel ve otel sınıfı belirleyin',
    'home.howItWorks.step1Tick3': 'Kişi sayısı, bagaj ve tüm özel isteklerinizi ekleyin',
    'home.howItWorks.step1Tick4': 'İsim, e-posta ve WhatsApp profilinizden otomatik alınır',
    'home.howItWorks.step1Tip': 'Rotanızdan emin değil misiniz? “Rotayı acenteler önersin” seçeneğini işaretleyin.',
    'home.howItWorks.step1Cta': 'Rotamı Oluştur',
    'home.howItWorks.step1CtaArrow': 'Rotayı Oluşturmaya Başla →',

    'home.howItWorks.step2Tick1': 'Fiyat, kapsam ve yıldız puanını yan yana karşılaştırın',
    'home.howItWorks.step2Tick2': 'Sohbetten sorular sorun — iletişim bilgileri gizli kalır',
    'home.howItWorks.step2Tick3': 'Planınızı dilediğiniz zaman güncelleyin; acenteler yeni sürümü alır',
    'home.howItWorks.step2Tick4': 'Eski teklifler güncelliğini yitirir, asla yanlış teklifi karşılaştırmazsınız',
    'home.howItWorks.step2Tip': 'Gezginler için ücretsizdir. QuoteMeTrip’e siz değil acenteler ödeme yapar.',
    'home.howItWorks.step2Cta': 'Tekliflerimi Gör',
    'home.howItWorks.step2CtaArrow': 'Teklifler Nasıl Çalışır →',

    'home.howItWorks.step3Tick1': 'Teklifi kabul etmek fiyatınızı sabitler ve teklif sürecini kapatır',
    'home.howItWorks.step3Tick2': 'Resmi rezervasyon belgesi ve PDF rota dökümünüzü alın',
    'home.howItWorks.step3Tick3': 'Her iki taraf için iletişim bilgileri anında açılır',
    'home.howItWorks.step3Tick4': 'Seyahatiniz sonrasında acentenizi değerlendirin ve puanlayın',
    'home.howItWorks.step3Tip': 'Seyahat sonrasında acenteyi 1-5 yıldızla puanlayarak diğer gezginlere destek olun.',
    'home.howItWorks.step3Cta': 'Rezervasyon Adımlarını Gör',
    'home.howItWorks.step3CtaArrow': 'Tatilimi Planla →',

    // Dedicated How It Works Page
    'howItWorks.page.title': 'QuoteMeTrip Nasıl Çalışır?',
    'howItWorks.page.subtitle': 'İlk seyahat fikrinizden onaylı ve güvenli bir tatile kadar, gezginlere sıfır ek ücretle üç şeffaf adım.',
    'howItWorks.page.realLocalExpertise': 'Gerçek Yerel Uzmanlık',
    'howItWorks.page.photobandTitle': 'Her gün planlı. Her teklif karşılaştırıldı.',
    'howItWorks.page.photobandDesc': 'Kalıplaşmış tur paketlerinin veya belirsiz aracı sitelerin aksine QuoteMeTrip kontrolü size verir. Destinasyon sıralamasını ve seyahat temponuzu siz belirlersiniz. Bölgedeki lisanslı acenteler en iyi fiyat ve kişiye özel hizmet için yarışır.',
    'howItWorks.page.statusTitle': 'Baştan Sona Seyahat Durumunuz',
    'howItWorks.page.statusSubtitle': 'Teklif talepleriniz ve rezervasyon aşamalarınızda anlık şeffaflık.',
    'howItWorks.page.ctaTitle': 'Türkiye Rotanızı Oluşturmaya Hazır Mısınız?',
    'howItWorks.page.ctaSubtitle': 'Rotanızı belirlemek ve özel teklifler almaya başlamak için 5 dakikanızı ayırın.',

    // Journey Status Timeline
    'journey.status.title': 'Baştan sona seyahat durumunuz',
    'journey.status.draft': 'Taslak',
    'journey.status.draftDesc': 'Hala planlama aşamasındasınız',
    'journey.status.sent': 'Gönderildi',
    'journey.status.sentDesc': 'Bölgedeki lisanslı acentelere iletildi',
    'journey.status.quotesReceived': 'Teklifler alındı',
    'journey.status.quotesReceivedDesc': 'Gelen teklifleri karşılaştırın',
    'journey.status.agreed': 'Anlaşıldı',
    'journey.status.agreedDesc': 'Fiyat sabitlendi, teklifler kapatıldı',
    'journey.status.depositPaid': 'Ön ödeme yapıldı',
    'journey.status.depositPaidDesc': 'İletişim bilgileri açıldı',
    'journey.status.confirmed': 'Onaylandı',
    'journey.status.confirmedDesc': 'Yazılı onay belgesi + PDF',

    'home.whyUs.title': 'Neden QuoteMeTrip?',
    'home.whyUs.subtitle':
      'Kişiselleştirilmiş rota planlaması ve şeffaf acente teklifleri için tasarlandı.',
    'home.whyUs.feature1Title': 'Rota Odaklı Planlama',
    'home.whyUs.feature1Desc':
      'Mesafe hesabı ve önerilen gün sayıları ile çok duraklı seyahat rotaları oluşturun.',
    'home.whyUs.feature2Title': 'Çoklu Acente Teklifleri',
    'home.whyUs.feature2Desc':
      'Lisanslı yerel seyahat acentelerinden doğrudan şeffaf teklifler toplayın.',
    'home.whyUs.feature3Title': 'Doğrudan İletişim',
    'home.whyUs.feature3Desc':
      'Detayları netleştirmek için acentelerle güvenli mesajlaşma platformundan sohbet edin.',
    'home.whyUs.feature4Title': 'Şeffaf İş Takibi',
    'home.whyUs.feature4Desc':
      'En uygun teklifi kabul edin ve seyahatinizi sonuna kadar sistem üzerinden takip edin.',

    'home.guide.title': 'Gezi Rehberi & İlham',
    'home.guide.subtitle': 'Gezgin tavsiyeleri, rota önerileri ve rehber yazıları.',
    'home.guide.viewAll': 'Gezi Rehberini Göster',

    'home.agencies.title': 'Onaylı Seyahat Acenteleri',
    'home.agencies.subtitle': 'Bölgelerin uzmanı lisanslı acenteler ile doğrudan bağlantı kurun.',
    'home.agencies.viewAll': 'Tüm Acenteleri Gör',

    'home.faq.title': 'Sıkça Sorulan Sorular',
    'home.faq.subtitle': 'QuoteMeTrip hakkında merak ettiğiniz her şey.',
    'home.faq.contactUs': 'Başka sorularınız mı var? Ekibimize ulaşın.',

    'faq.q1': 'Talep göndermek ücretsiz mi?',
    'faq.a1': 'Evet. Rota oluşturmak, teklif almak ve karşılaştırmak gezginler için tamamen ücretsizdir.',
    'faq.q2': 'Talebimi hangi acenteler alır?',
    'faq.a2': 'Yalnızca seçtiğiniz bölgede faaliyet gösteren lisanslı ve onaylı acenteler alır.',
    'faq.q3': 'Gönderdikten sonra rotamı düzenleyebilir miyim?',
    'faq.a3': 'Evet, bir teklifi kabul edene kadar düzenleyebilirsiniz. Yeni sürüm acentelere tekrar iletilir.',
    'faq.q4': 'Tatilimin ödemesini nasıl yaparım?',
    'faq.a4': 'Doğrudan acenteye — güvenli ödeme linki, banka transferi veya nakit olarak.',
    'faq.q5': 'İletişim bilgileri ne zaman paylaşılır?',
    'faq.a5': 'Bir teklifi kabul edip ön ödemeyi onayladıktan sonra iletişim bilgileri karşılıklı açılır.',
    'faq.q6': 'Rotamı yazdırabilir miyim?',
    'faq.a6': 'Evet. Her rota ve onay belgesi yazdırılabilir veya PDF olarak kaydedilebilir.',

    'home.cta.title': 'Seyahatinizi Planlamaya Hazır Mısınız?',
    'home.cta.subtitle': 'Rotanızı hemen oluşturun ve acentelerden teklif almaya başlayın.',
    'home.cta.button': 'Tatilimi Planla',

    // Public Pages
    'destinations.title': 'Destinasyonları Keşfedin',
    'destinations.subtitle': 'İlham veren yerleri inceleyin ve seyahat rotanızı oluşturun.',
    'destinations.searchPlaceholder': 'Destinasyon veya bölge ara...',
    'destinations.planCTA': 'İçin Rota Planla',
    'destinations.overview': 'Genel Bakış',
    'destinations.highlights': 'Popüler Yerler ve Öne Çıkanlar',
    'destinations.relatedGuides': 'İlgili Gezi Rehberleri',
    'destinations.notFound': 'Destinasyon Bulunamadı',
    'destinations.notFoundDesc': 'İstediğiniz destinasyon mevcut değil.',
    'destinations.backToDestinations': 'Destinasyonlara Geri Dön',

    'guide.title': 'Gezi Rehberleri',
    'guide.subtitle': 'Detaylı gezi yazıları, yerel tavsiyeler ve rota fikirleri.',
    'guide.searchPlaceholder': 'Rehber yazılarında ara...',
    'guide.category.all': 'Tüm Kategoriler',
    'guide.category.cityGuide': 'Şehir Rehberi',
    'guide.category.adventure': 'Macera',
    'guide.category.historyCulture': 'Tarih & Kültür',
    'guide.category.natureHeritage': 'Doğa & Miras',
    'guide.category.archaeology': 'Arkeoloji',
    'guide.category.coastBeaches': 'Sahil & Plajlar',
    'guide.readTime': '{count} dk okuma',
    'guide.read': 'OKUMA',
    'guide.readArticle': 'Makaleyi Oku',
    'guide.clearFilters': 'Filtreleri Temizle',
    'guide.adjustSearch': 'Arama terimlerinizi veya filtreleri değiştirmeyi deneyin.',
    'guide.published': 'Yayınlanma',
    'guide.relatedGuides': 'İlgili Gezi Rehberleri',
    'guide.backToGuides': 'Gezi Rehberlerine Geri Dön',
    'guide.notFound': 'Makale Bulunamadı',
    'guide.notFoundDesc': 'İstediğiniz makale mevcut değil.',

    'agencies.title': 'Seyahat Acenteleri',
    'agencies.subtitle': 'Size özel seyahat teklifi sunmaya hazır onaylı acenteler.',
    'agencies.searchPlaceholder': 'Acente veya şehir ara...',

    'about.title': 'QuoteMeTrip Hakkında',
    'about.subtitle':
      'Gezginlerin özgürce rota oluşturmasını ve güvenilir acentelerle buluşmasını sağlıyoruz.',

    'contact.title': 'İletişim',
    'contact.subtitle': 'Sorularınız veya geri bildirimleriniz için bize ulaşın.',
    'contact.name': 'Adınız',
    'contact.email': 'E-posta Adresiniz',
    'contact.subject': 'Konu',
    'contact.message': 'Mesajınız',
    'contact.send': 'Mesaj Gönder',
    'contact.sending': 'Gönderiliyor...',
    'contact.success': 'Teşekkürler! Mesajınız başarıyla iletildi.',

    // Common UI
    'common.explore': 'İncele',
    'common.readMore': 'Yazıyı Oku',
    'common.viewProfile': 'Acenteyi İncele',
    'common.search': 'Ara',
    'common.filter': 'Filtrele',
    'common.all': 'Tümü',
    'common.loading': 'Yükleniyor...',
    'common.empty': 'Aramanıza uygun sonuç bulunamadı.',
    'common.error': 'İçerik yüklenirken bir sorun oluştu.',
    'common.retry': 'Tekrar Dene',
    'common.save': 'Kaydet',
    'common.saving': 'Kaydediliyor...',
    'common.saved': 'Kaydedildi',
    'common.cancel': 'İptal',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.back': 'Geri',
    'common.next': 'İleri',
    'common.finish': 'Tamamla',
    'common.status': 'Durum',
    'common.date': 'Tarih',
    'common.actions': 'İşlemler',
    'common.yes': 'Evet',
    'common.no': 'Hayır',
    'common.confirm': 'Onayla',
    'common.details': 'Detaylar',
    'common.viewAll': 'Tümünü gör',
    'common.refresh': 'Yenile',
    'common.language': 'Dil',
    'footer.copyright': '© QuoteMeTrip. Tüm hakları saklıdır.',

    // Authentication
    'auth.signIn': 'Giriş Yap',
    'auth.register': 'Hesap Oluştur',
    'auth.email': 'E-posta Adresi',
    'auth.password': 'Şifre',
    'auth.fullName': 'Ad Soyad',
    'auth.role': 'Hesap Türü',
    'auth.role.traveller': 'Gezgin',
    'auth.role.agency': 'Seyahat Acentesi',
    'auth.googleSignIn': 'Google ile Devam Et',
    'auth.forgotPassword': 'Şifrenizi mi unuttunuz?',
    'auth.noAccount': 'Hesabınız yok mu?',
    'auth.haveAccount': 'Zaten bir hesabınız var mı?',
    'auth.signingIn': 'Giriş yapılıyor...',
    'auth.registering': 'Hesap oluşturuluyor...',

    // Dashboard
    'dashboard.welcome': 'İyi {timeOfDay}, {name} 👋',
    'dashboard.welcome.default': 'Tekrar hoş geldin, {name} 👋',
    'dashboard.welcome.time.morning': 'sabahlar',
    'dashboard.welcome.time.afternoon': 'günler',
    'dashboard.welcome.time.evening': 'akşamlar',
    'dashboard.planNextTrip': 'Bir sonraki seyahatinizi planlamaya hazır mısınız?',
    'dashboard.planTripAction': 'Tatilimi Planla',
    'dashboard.summary.requests': 'Seyahat Talepleri',
    'dashboard.summary.quotations': 'Teklifler',
    'dashboard.summary.jobs': 'Aktif Seyahatler',
    'dashboard.summary.messages': 'Okunmamış Mesajlar',
    'dashboard.summary.notifications': 'Bildirimler',

    'dashboard.action.draft.title': 'Seyahatinize devam edin',
    'dashboard.action.draft.desc': 'Taslağınız henüz tamamlanmadı.',
    'dashboard.action.draft.btn': 'Planlamaya devam et',
    'dashboard.action.quote.title': 'Yeni teklifler alındı',
    'dashboard.action.quote.desc': 'Acentelerden gelen yeni tekliflerinizi inceleyin.',
    'dashboard.action.quote.btn': 'Teklifleri görüntüle',
    'dashboard.action.job.title': 'Aktif bir seyahatiniz var',
    'dashboard.action.job.desc': 'Seyahatiniz devam ediyor.',
    'dashboard.action.job.btn': 'Seyahatimi görüntüle',
    'dashboard.action.empty.title': 'İlk seyahatinizi planlayın',
    'dashboard.action.empty.desc':
      'Nereye gitmek istediğinizi söyleyin, seyahatinizi organize edelim.',
    'dashboard.action.empty.btn': 'Tatilimi Planla',

    'dashboard.section.requests': 'Son Seyahat Talepleri',
    'dashboard.section.quotations': 'Son Teklifler',
    'dashboard.section.jobs': 'Aktif Seyahatler',
    'dashboard.section.messages': 'Son Mesajlar',

    'dashboard.empty.requests': 'Henüz talep yok.',
    'dashboard.empty.quotations': 'Henüz teklif yok.',
    'dashboard.empty.jobs': 'Henüz aktif seyahat yok.',
    'dashboard.empty.messages': 'Son mesaj yok.',

    // Trip & Quotation workflow
    'trip.package.blue_cruise': 'Mavi Tur',
    'trip.cruiseDuration.title': 'Mavi tur sürenizi seçin',
    'trip.cruiseDuration.4d_3n': '4 Gün / 3 Gece',
    'trip.cruiseDuration.6d_5n': '6 Gün / 5 Gece',
    'trip.cruiseDurationRequired': 'Lütfen bir mavi tur süresi seçin.',

    'status.draft': 'Taslak',
    'status.submitted': 'Gönderildi',
    'status.accepted': 'Kabul Edildi',
    'status.cancelled': 'İptal Edildi',
    'status.in_progress': 'Devam Ediyor',
    'status.completed': 'Tamamlandı',
    'status.declined': 'Reddedildi',
    'status.pending': 'Beklemede',
    'status.approved': 'Onaylandı',
    'status.rejected': 'Reddedildi',
    'status.active': 'Aktif',
    'status.inactive': 'Pasif',
    'status.suspended': 'Askıya Alındı',
    'status.expired': 'Süresi Doldu',
    'status.paid': 'Ödendi',
    'status.unpaid': 'Ödenmedi',
    'status.matching': 'Eşleşiyor',
    'status.quoted': 'Teklif Verildi',
    'status.all': 'Tümü',

    // Agency Portal
    'agency.coverage.title': 'Hizmet Kapsamı ve Yetkinlikler',
    'agency.coverage.subtitle':
      'Uygun seyahat taleplerini almak için faaliyet gösterdiğiniz bölgeleri ve sunduğunuz hizmetleri seçin.',
    'agency.coverage.operatingAreas': 'Faaliyet Bölgeleri / Coğrafi Kapsam',
    'agency.coverage.searchPlaceholder':
      'Destinasyon ara (ör. İstanbul, Kapadokya, Antalya...)',
    'agency.coverage.selectedAreas': 'Seçilen Faaliyet Bölgeleri',
    'agency.coverage.noAreas':
      'Henüz faaliyet bölgesi seçilmedi. Eşleşen talepleri almak için en az bir destinasyon ekleyin.',
    'agency.coverage.servicesProvided': 'Sunulan Hizmetler',
    'agency.coverage.noServices':
      'Henüz hizmet seçilmedi. Acentenizin sağladığı hizmet yetkinliklerini seçin.',
    'agency.coverage.save': 'Değişiklikleri Kaydet',
    'agency.coverage.saving': 'Kaydediliyor...',
    'agency.coverage.saved': 'Değişiklikler Kaydedildi',
    'agency.status.title': 'Onay Durumu',
    'agency.status.pending': 'Onay Bekliyor',
    'agency.status.approved': 'Onaylandı ve Aktif',
    'agency.status.suspended': 'Hesap Askıya Alındı',
    'agency.status.rejected': 'Kayıt Reddedildi',
    'agency.membership.active': 'Aktif Üyelik',
    'agency.membership.inactive': 'Pasif Üyelik',

    // Messaging & Dynamic Translation
    'chat.sendMessage': 'Mesaj Gönder',
    'chat.placeholder': 'Mesajınızı yazın...',
    'chat.translate': 'Türkçe’ye Çevir',
    'chat.translateEn': 'İngilizce’ye Çevir',
    'chat.showOriginal': 'Orijinali Göster',
    'chat.translating': 'Çevriliyor...',
    'chat.cachedNotice': 'Kayıtlı çeviri',

    // Admin Portal
    'admin.dashboard': 'Genel Bakış',
    'admin.agencies': 'Acente Onayları',
    'admin.memberships': 'Üyelikler',
    'admin.plans': 'Üyelik Paketleri',
    'admin.commissions': 'Komisyonlar',
    'admin.travelRequests': 'Seyahat Talepleri',
    'admin.jobs': 'İşler ve Rezervasyonlar',
    'admin.auditLogs': 'Denetim Kayıtları',
    'admin.translations': 'Çeviri Önbelleği ve İstatistikler',

    // Agencies Directory
    'agencies.verifiedIn': 'Onaylı Seyahat Acenteleri -',
    'agencies.licensedIn': 'Bölgesinde hizmet veren lisanslı yerel seyahat acenteleri:',
    'agencies.readyToPlan': 'seyahatinizi planlamaya ve gerçekleştirmeye hazır.',
    'agencies.filter.all': 'Tüm Lokasyonlar',
    'agencies.filter.turkey': 'Türkiye (Tümü)',
    'agencies.filter.turkeyNationwide': 'Türkiye (Genel)',
    'agencies.filter.istanbul': 'İstanbul',
    'agencies.filter.cappadocia': 'Kapadokya',
    'agencies.filter.cappadociaNevsehir': 'Nevşehir (Kapadokya)',
    'agencies.filter.antalya': 'Antalya',
    'agencies.filter.izmir': 'İzmir',
    'agencies.filter.izmirAegean': 'İzmir (Ege)',

    // Agency Specialties
    'agency.specialty.culturalTours': 'Kültür Turları',
    'agency.specialty.privateDrivers': 'Özel Şoförler',
    'agency.specialty.vipTransfers': 'VIP Transferler',
    'agency.specialty.luxuryHotels': 'Lüks Oteller',
    'agency.specialty.coastalRoutes': 'Sahil Rotaları',
    'agency.specialty.yachtCharters': 'Yat Kiralama',
    'agency.specialty.beachResorts': 'Tatil Köyleri',
    'agency.specialty.familyHolidays': 'Aile Tatilleri',
    'agency.specialty.balloonRides': 'Balon Turları',
    'agency.specialty.caveHotels': 'Mağara Otelleri',
    'agency.specialty.trekking': 'Doğa Yürüyüşü',
    'agency.specialty.photographyTours': 'Fotoğraf Turları',
    'agency.specialty.ancientSites': 'Antik Kentler',
    'agency.specialty.wineCulinary': 'Gastronomi & Şarap',
    'agency.specialty.boutiqueEscapes': 'Butik Kaçamaklar',
    'agency.specialty.selfDriveRoutes': 'Kendi Aracınızla Rotalar',

    // Travel Services
    'services.title': 'Türkiye Seyahat Hizmetleri',
    'services.subtitle': 'Onaylı yerel seyahat acenteleri tarafından sunulan özelleştirilebilir hizmetler.',
    'services.searchPlaceholder': 'Seyahat hizmetlerinde ara (tur, transfer, rehber, balon)...',
    'services.verifiedService': 'Onaylı Hizmet',
    'services.popularLocations': 'Popüler Lokasyonlar:',
    'services.viewDetails': 'Detayları Gör →',
    'services.requestService': 'Hizmet Talep Et',
    'services.noMatch': 'Aramanızla eşleşen seyahat hizmeti bulunamadı.',
    'services.resetSearch': 'Aramayı Sıfırla',
    'services.overview': 'Genel Bakış',
    'services.inclusions': 'Neler Dahil',
    'services.standards': 'Hizmet Standartları & Güvenceler',
    'services.booking': 'Hizmet Rezervasyonu',
    'services.bookingSubtitle': 'Özel rotanızı oluştururken bu hizmeti seçerek onaylı yerel acentelerden rekabetçi teklifler alın.',
    'services.availableRegions': 'Geçerli Bölgeler:',
    'services.planWith': '{name} ile Seyahat Planla →',
    'services.popularFor': '{name} için Popüler Destinasyonlar',
    'services.popularForDesc': 'Bu hizmetin sıklıkla talep edildiği destinasyonları keşfedin.',
    'services.bookWith': 'Onaylı Acentelerle {name} Rezervasyonu Yapın',
    'services.bookWithDesc': 'Seyahat tarihlerinizi ve tercihlerinizi iletin. Eşleşen yerel acenteler kalem kalem tekliflerini sunsun.',
    'services.service.privateTours.name': 'Özel Turlar',
    'services.service.privateTours.tagline': 'Onaylı rehberler ve lüks ulaşım ile size özel kültürel rotalar',
    'services.service.privateTransfer.name': 'Özel Transfer',
    'services.service.privateTransfer.tagline': 'Türkiye genelinde dakik ve konforlu adrese teslim ulaşım',
    'services.service.minibusWithDriver.name': 'Şoförlü Minibüs',
    'services.service.minibusWithDriver.tagline': 'Aileler, gruplar ve çok günlük seyahat rotaları için şoförlü araçlar',
    'services.service.guide.name': 'Onaylı Rehber',
    'services.service.guide.tagline': 'Kültür ve Turizm Bakanlığı onaylı uzmanlarla tarihi ve kültürü yaşayın',
    'services.service.hotAirBalloon.name': 'Sıcak Hava Balonu',
    'services.service.hotAirBalloon.tagline': 'Kapadokya peri bacaları üzerinde gün doğumunda unutulmaz uçuşlar',

    // Destinations & Country Hub
    'destinations.featuredRegion': 'Öne Çıkan Bölge',
    'destinations.turkeyGuide': 'Türkiye Ülke Rehberi',
    'destinations.turkeyGuideDesc': 'Ulusal seyahat esasları, popüler tatil rotaları ve bölgesel hizmetleri inceleyin.',
    'destinations.exploreTurkey': 'Türkiye Rehberini Keşfet →',
    'destinations.allRegions': 'Tüm Bölgeler',
    'destinations.region.marmara': 'Marmara',
    'destinations.region.centralAnatolia': 'İç Anadolu',
    'destinations.region.mediterranean': 'Akdeniz',
    'destinations.region.aegean': 'Ege',
    'destinations.region.blackSea': 'Karadeniz',
    'country.about': '{name} Hakkında',
    'country.whyTravel': 'Neden {name} için QuoteMeTrip?',
    'country.routeFirst': 'Rota Odaklı Planlama',
    'country.routeFirstDesc': 'İstanbul, Kapadokya ve Ege kalıntıları arasında gerçek transit süreleriyle çok şehirli rotalar oluşturun.',
    'country.licensedOperators': 'Onaylı Acenteler',
    'country.licensedOperatorsDesc': 'Yalnızca resmi onaylı Türk seyahat acentelerinden teklif alın.',
    'country.travelEssentials': 'Seyahat Bilgileri',
    'country.currency': 'Para Birimi:',
    'country.capital': 'Başkent:',
    'country.languages': 'Diller:',
    'country.bestTime': 'En Uygun Ziyaret Zamanı:',
    'country.gateways': 'Havalimanları:',
    'country.planTripIn': '{name} Seyahati Planla →',
    'country.destinationsIn': '{name} Destinasyonları',
    'country.destinationsInDesc': 'Yerel öne çıkanları, turları ve önerileri görmek için bir destinasyon seçin.',
    'country.servicesIn': '{name} Seyahat Hizmetleri',
    'country.servicesInDesc': 'Onaylı yerel operatörler tarafından sağlanan profesyonel hizmetler.',
    'country.guidesIn': 'Gezi Rehberleri & Rota Tavsiyeleri',
    'country.guidesInDesc': 'Bölge uzmanları tarafından hazırlanan içgörüler ve seyahat planları.',
    'country.readyToVisit': '{name} Ziyaretine Hazır mısınız?',
    'country.readyToVisitDesc': 'Türkiye genelinde rotanızı oluşturun ve onaylı yerel acentelerden detaylı teklifler alın.',

    // Plan Trip & Route Engine
    'planTrip.title': 'Seyahatinizi Planlayın',
    'planTrip.step1': 'Rota',
    'planTrip.step2': 'Detaylar',
    'planTrip.step3': 'Günlük Plan',
    'planTrip.step4': 'İnceleme',
    'route.addDestination': 'Destinasyon Ekle',
    'route.searchPlaceholder': 'Şehir ara (örn. İstanbul, Bodrum)...',
    'route.startLocation': '1. Başlangıç Noktası',
    'route.intermediateStop': 'Ara Durak',
    'route.finalDestination': 'Varış Noktası',
    'route.add': 'Ekle',
    'route.selectedDestinations': 'Seçilen Destinasyonlar',
    'route.adjustOrder': 'Sıralamayı oklarla değiştirebilirsiniz',
    'route.noStops': 'Henüz destinasyon eklenmedi',
    'route.noStopsDesc': 'Kişiselleştirilmiş seyahat rotanızı oluşturmak için yukarıdan başlangıç noktanızı arayın.',
    'route.calculating': 'Google Yol Rotası Hesaplanıyor...',
    'route.needMinStops': 'Rota hesaplamak için en az 2 destinasyon ekleyin',
    'route.recalculate': 'Rotayı Yeniden Hesapla ({count} durak)',
    'route.calculated': 'Rota Hesaplandı · Yeniden Hesapla ({count} durak)',
    'route.calculate': 'Rotayı Hesapla ({count} durak)',

    // Agency & Admin Navigation
    'agency.nav.dashboard': 'Kontrol Paneli',
    'agency.nav.requests': 'Gelen Talepler',
    'agency.nav.quotations': 'Tekliflerim',
    'agency.nav.messages': 'Mesajlar',
    'agency.nav.jobs': 'Onaylanan İşler',
    'agency.nav.profile': 'Acente Profili',
    'admin.nav.overview': 'GENEL BAKIŞ',
    'admin.nav.dashboard': 'Kontrol Paneli',
    'admin.nav.agencyPlans': 'ACENTE & PLANLAR',
    'admin.nav.agencies': 'Acenteler',
    'admin.nav.memberships': 'Üyelikler',
    'admin.nav.membershipPlans': 'Üyelik Planları',
    'admin.nav.commissions': 'Komisyonlar',
    'admin.nav.marketplace': 'PAZARYERİ',
    'admin.nav.travelRequests': 'Seyahat Talepleri',
    'admin.nav.jobs': 'İşler',
    'admin.nav.broadcasts': 'DUYURULAR',
    'admin.nav.announcements': 'Duyurular ve Bildirimler',
    'admin.nav.security': 'GÜVENLİK',
    'admin.nav.auditLogs': 'Denetim Kayıtları',
    'admin.operations': 'QuoteMeTrip Operasyonları',
    'admin.verifiedAdmin': 'Onaylı Sistem Yöneticisi',

    // Admin Dashboard
    'admin.dashboard.greeting': 'İyi günler, Yönetici',
    'admin.dashboard.subtitle': 'QuoteMeTrip pazaryerindeki acenteleri, talepleri, üyelikleri ve platform operasyonlarını takip edin.',
    'admin.dashboard.totalAgencies': 'Toplam Acente',
    'admin.dashboard.pending': 'Beklemede: {count}',
    'admin.dashboard.approved': 'Onaylı: {count}',
    'admin.dashboard.activeMemberships': 'Aktif Üyelikler',
    'admin.dashboard.expired': 'Süresi Dolan: {count}',
    'admin.dashboard.travelRequests': 'Seyahat Talepleri',
    'admin.dashboard.activeJobs': 'Aktif İşler: {count}',
    'admin.dashboard.completed': 'Tamamlanan: {count}',
    'admin.dashboard.totalCommissions': 'Toplam Komisyon',
    'admin.dashboard.paid': 'Ödenen: ${amount}',
    'admin.dashboard.pendingCommission': 'Bekleyen: ${amount}',
    'admin.dashboard.attentionNeeded': 'Operasyonel Dikkat Gerekenler',
    'admin.dashboard.agencyAlert': '{count} acente kaydı belge doğrulaması ve onay bekliyor.',
    'admin.dashboard.reviewAgencies': 'Acenteleri İncele',
    'admin.dashboard.allAgenciesReviewed': 'Tüm acente başvuruları incelendi.',
    'admin.dashboard.membershipAlert': '{count} üyelik ödemesi manuel yönetici onayı bekliyor.',
    'admin.dashboard.confirmPayments': 'Ödemeleri Onayla',
    'admin.dashboard.errorLoading': 'Kontrol paneli metrikleri yüklenemedi.',
    'admin.dashboard.retry': 'Yeniden Dene',

    // Admin Common
    'admin.common.view': 'Görüntüle',
    'admin.common.manage': 'Yönet',
    'admin.common.requests': 'Talepler',
    'admin.common.details': 'Detaylar',
    'admin.common.edit': 'Düzenle',
    'admin.common.delete': 'Sil',
    'admin.common.save': 'Kaydet',
    'admin.common.cancel': 'İptal',
    'admin.common.confirm': 'Onayla',
    'admin.common.close': 'Kapat',
    'admin.common.refresh': 'Yenile',
    'admin.common.search': 'Ara',
    'admin.common.filter': 'Filtrele',
    'admin.common.status': 'Durum',
    'admin.common.actions': 'İşlemler',
    'admin.common.previous': 'Önceki',
    'admin.common.next': 'Sonraki',
    'admin.common.pageOf': 'Sayfa {page} / {totalPages} ({totalItems} kayıt)',
    'admin.common.pageOfAgencies': 'Sayfa {page} / {totalPages} ({totalItems} acente)',
    'admin.common.loading': 'Yükleniyor...',
    'admin.common.error': 'Hata',
    'admin.common.tryAgain': 'Tekrar Dene',
    'admin.common.success': 'Başarılı',
    'admin.common.optional': 'İsteğe Bağlı',
    'admin.common.allStatuses': 'Tüm Durumlar',
    'admin.common.all': 'Tümü',
    'admin.common.profile': 'Profil',
    'admin.common.signOut': 'Çıkış Yap',
    'admin.common.signedInAs': 'Giriş yapan: {email}',
    'admin.common.notifications': 'Bildirimler',

    // Admin Agencies Directory & Approval
    'admin.agencies.eyebrow': 'Acente Dizini ve Uyumluluk',
    'admin.agencies.title': 'Acente Dizini ve Onay Yönetimi',
    'admin.agencies.subtitle': 'Acente kayıtlarını, belge doğrulama uyumluluğunu ve operasyonel hesap durumlarını yönetin.',
    'admin.agencies.totalAgencies': 'Toplam Acente',
    'admin.agencies.pendingReview': 'İnceleme Bekleyenler',
    'admin.agencies.approvedActive': 'Onaylı ve Aktif',
    'admin.agencies.suspendedInactive': 'Askıya Alınan / Pasif',
    'admin.agencies.searchPlaceholder': 'Acente adı, e-posta, şehir, ülke ile ara...',
    'admin.agencies.colAgency': 'Acente',
    'admin.agencies.colContact': 'İletişim / E-posta',
    'admin.agencies.colLocation': 'Konum',
    'admin.agencies.colStatus': 'Durum',
    'admin.agencies.colDocs': 'Belgeler',
    'admin.agencies.colMemberships': 'Üyelikler',
    'admin.agencies.colActions': 'İşlemler',
    'admin.agencies.docCount': '{count} belge',
    'admin.agencies.membershipCount': '{count} kayıt',
    'admin.agencies.approve': 'Onayla',
    'admin.agencies.reject': 'Reddet',
    'admin.agencies.suspend': 'Askıya Al',
    'admin.agencies.reactivate': 'Yeniden Aktifleştir',
    'admin.agencies.emptyTitle': 'Acente bulunamadı',
    'admin.agencies.emptyFiltered': 'Arama ve filtre kriterlerinize uyan kayıtlı seyahat acentesi bulunamadı.',
    'admin.agencies.emptyAll': 'QuoteMeTrip platformunda henüz kayıtlı seyahat acentesi bulunmuyor.',
    'admin.agencies.confirmModalTitle': '{type} İşlemini Onayla',
    'admin.agencies.confirmModalMsg': '{name} acentesi için {type} işlemini gerçekleştirmek istediğinizden emin misiniz?',
    'admin.agencies.reasonLabel': 'Gerekçe / Yönetici Notu (İsteğe Bağlı):',
    'admin.agencies.reasonPlaceholder': 'Bu işlem için gerekçe girin...',
    'admin.agencies.updateSuccess': '"{name}" acentesi başarıyla güncellendi.',
    'admin.agencies.actionFailed': 'İşlem başarısız: {message}',
    'admin.agencies.loadingRecords': 'Acente kayıtları yükleniyor...',
    'admin.agencies.failedToLoad': 'Acente kayıtları yüklenemedi',
    'admin.agencies.processing': 'İşleniyor...',

    // Admin Agency Detail & Verification
    'admin.agencyDetail.backToAgencies': 'Acente Dizinine Dön',
    'admin.agencyDetail.registeredOn': 'Kayıt Tarihi: {date} — Kullanıcı ID #{id}',
    'admin.agencyDetail.overviewTab': 'Genel Bakış ve İletişim',
    'admin.agencyDetail.documentsTab': 'Uyumluluk Belgeleri ({count})',
    'admin.agencyDetail.membershipsTab': 'Atanan Üyelikler ({count})',
    'admin.agencyDetail.auditTab': 'Denetim Geçmişi',
    'admin.agencyDetail.contactInfo': 'İletişim ve Kimlik Bilgileri',
    'admin.agencyDetail.businessDetails': 'Ticari ve Yasal Bilgiler',
    'admin.agencyDetail.contactPerson': 'Yetkili Kişi',
    'admin.agencyDetail.email': 'Kurumsal E-posta',
    'admin.agencyDetail.phone': 'Telefon Numarası',
    'admin.agencyDetail.website': 'Web Sitesi',
    'admin.agencyDetail.address': 'Açık Adres',
    'admin.agencyDetail.city': 'Şehir',
    'admin.agencyDetail.country': 'Ülke',
    'admin.agencyDetail.tursabLicense': 'TÜRSAB / Lisans Numarası',
    'admin.agencyDetail.taxNumber': 'Vergi Numarası',
    'admin.agencyDetail.taxOffice': 'Vergi Dairesi',
    'admin.agencyDetail.companyTitle': 'Resmi Şirket Unvanı',
    'admin.agencyDetail.bio': 'Acente Açıklaması / Biyografi',
    'admin.agencyDetail.verifyDocument': 'Belgeyi Onayla',
    'admin.agencyDetail.rejectDocument': 'Belgeyi Reddet',
    'admin.agencyDetail.verified': 'Doğrulandı',
    'admin.agencyDetail.rejected': 'Reddedildi',
    'admin.agencyDetail.viewDocument': 'Belgeyi Görüntüle',
    'admin.agencyDetail.noDocuments': 'Henüz uyumluluk belgesi yüklenmemiş.',
    'admin.agencyDetail.assignMembership': 'Üyelik Planı Ata',
    'admin.agencyDetail.planSelectLabel': 'Plan Seçin',
    'admin.agencyDetail.paymentRefLabel': 'Ödeme Referansı / Dekont No',
    'admin.agencyDetail.assignBtn': 'Planı Ata',
    'admin.agencyDetail.notFound': 'Acente bulunamadı',
    'admin.agencyDetail.notFoundDesc': 'İstenen acente kaydı bulunamadı veya silinmiş.',
    'admin.agencyDetail.docVerifySuccess': 'Belge doğrulandı ve onaylandı.',
    'admin.agencyDetail.docRejectSuccess': 'Belge yönetici notu ile reddedildi.',
    'admin.agencyDetail.memAssignSuccess': 'Üyelik planı acenteye başarıyla atandı.',
    'admin.agencyDetail.rejectDocTitle': 'Uyumluluk Belgesini Reddet',
    'admin.agencyDetail.rejectDocDesc': 'Bu belgenin neden uyumluluk standartlarını karşılamadığını açıklayan bir yönetici notu girin:',
    'admin.agencyDetail.rejectDocNotePlaceholder': 'Gerekli düzeltmeleri veya eksik bilgileri belirtin...',

    // Admin Memberships Management
    'admin.memberships.title': 'Acente Üyelik Yönetimi ve Ödemeler',
    'admin.memberships.subtitle': 'Acente abonelik paketlerini yönetin, havale/EFT ödemelerini doğrulayın ve eşleşme durumunu denetleyin.',
    'admin.memberships.colAgency': 'Acente',
    'admin.memberships.colPlan': 'Plan',
    'admin.memberships.colStatus': 'Durum',
    'admin.memberships.colPrice': 'Fiyat',
    'admin.memberships.colDates': 'Geçerlilik Süresi',
    'admin.memberships.colPaymentRef': 'Ödeme Dekontu',
    'admin.memberships.colActions': 'İşlemler',
    'admin.memberships.confirmPaymentBtn': 'Ödemeyi Onayla',
    'admin.memberships.suspendBtn': 'Askıya Al',
    'admin.memberships.reactivateBtn': 'Yeniden Aktifleştir',
    'admin.memberships.confirmPaymentTitle': 'Üyelik Ödemesini Onayla',
    'admin.memberships.confirmPaymentDesc': '{agency} ({plan}) için manuel ödemeyi kaydedip onaylayın. Bu işlem üyeliği derhal aktif hale getirecektir.',
    'admin.memberships.paymentRefLabel': 'Ödeme Referansı / Banka Dekont No:',
    'admin.memberships.paymentRefPlaceholder': 'örn. TR-BANK-987654321',
    'admin.memberships.adminNotesLabel': 'Yönetici Notları (İsteğe Bağlı):',
    'admin.memberships.adminNotesPlaceholder': 'Banka transferi ile ödeme doğrulandı...',
    'admin.memberships.paymentSuccess': 'Ödeme başarıyla onaylandı.',
    'admin.memberships.suspendTitle': 'Acente Üyeliğini Askıya Al',
    'admin.memberships.suspendMessage': 'Bu acente üyeliğini askıya almak istediğinizden emin misiniz? Askıya alındığında acente teklif eşleşme yetkisini kaybedecektir.',
    'admin.memberships.suspendConfirmText': 'Üyeliği Askıya Al',
    'admin.memberships.suspendSuccess': 'Üyelik başarıyla askıya alındı.',
    'admin.memberships.reactivateTitle': 'Acente Üyeliğini Yeniden Aktifleştir',
    'admin.memberships.reactivateMessage': 'Bu acente üyeliğini yeniden aktifleştirmek istiyor musunuz? Acente aktif eşleşme yetkisini tekrar kazanacaktır.',
    'admin.memberships.reactivateConfirmText': 'Üyeliği Aktifleştir',
    'admin.memberships.reactivateSuccess': 'Üyelik başarıyla yeniden aktifleştirildi.',
    'admin.memberships.empty': 'Geçerli kriterlere uygun üyelik kaydı bulunamadı.',
    'admin.memberships.loading': 'Üyelik kayıtları yükleniyor...',

    // Admin Membership Plans
    'admin.membershipPlans.title': 'Üyelik Planları ve Paketler',
    'admin.membershipPlans.subtitle': 'Abonelik paketlerini, teklif kotalarını, komisyon oranlarını ve pazaryeri yetkilerini yapılandırın.',
    'admin.membershipPlans.createPlan': 'Yeni Plan Oluştur',
    'admin.membershipPlans.editPlan': 'Planı Düzenle',
    'admin.membershipPlans.planName': 'Plan Adı',
    'admin.membershipPlans.planCode': 'Plan Kodu',
    'admin.membershipPlans.price': 'Fiyat (TRY)',
    'admin.membershipPlans.duration': 'Süre (Gün)',
    'admin.membershipPlans.quoteLimit': 'Aylık Teklif Kotası',
    'admin.membershipPlans.unlimited': 'Sınırsız',
    'admin.membershipPlans.commissionRate': 'Komisyon Oranı (%)',
    'admin.membershipPlans.features': 'Özellikler ve Dahil Hizmetler (her satıra bir adet)',
    'admin.membershipPlans.active': 'Aktif',
    'admin.membershipPlans.inactive': 'Pasif',
    'admin.membershipPlans.activate': 'Aktifleştir',
    'admin.membershipPlans.deactivate': 'Pasifleştir',
    'admin.membershipPlans.deleteTitle': 'Üyelik Planını Sil',
    'admin.membershipPlans.deleteMessage':
      '"{name}" üyelik planını kalıcı olarak silmek istediğinizden emin misiniz? Acenteler bu plana kayıtlıysa silme engellenir, bunun yerine pasifleştirmelisiniz.',
    'admin.membershipPlans.deactivateInstead': 'Bunun Yerine Planı Pasifleştir',
    'admin.membershipPlans.savePlan': 'Planı Kaydet',
    'admin.membershipPlans.planDeleted': '"{name}" üyelik planı silindi.',
    'admin.membershipPlans.planCreated': '"{name}" üyelik planı başarıyla oluşturuldu.',
    'admin.membershipPlans.planUpdated': '"{name}" üyelik planı başarıyla güncellendi.',
    'admin.membershipPlans.planStatusChanged': '"{name}" üyelik planı durumu {status} olarak güncellendi.',
    'admin.membershipPlans.loading': 'Üyelik planları yükleniyor...',
    'admin.membershipPlans.empty': 'Henüz yapılandırılmış bir üyelik planı bulunmuyor.',
    'admin.membershipPlans.emptyDesc': 'İlk abonelik paketinizi tanımlamak için "Yeni Plan Oluştur" butonuna tıklayın.',
    'admin.membershipPlans.slug': 'Kısa Ad (Slug)',
    'admin.membershipPlans.description': 'Açıklama',
    'admin.membershipPlans.days': 'gün',
    'admin.membershipPlans.deletePlan': 'Planı Sil',
    'admin.membershipPlans.saving': 'Kaydediliyor...',

    // Admin Commissions
    'admin.commissions.title': 'Komisyon Takibi',
    'admin.commissions.subtitle': 'Kabul edilen pazaryeri işlerinden platform komisyon gelirlerini takip edin.',
    'admin.commissions.totalEarned': 'Toplam Kazanılan',
    'admin.commissions.pendingAmount': 'Beklemede',
    'admin.commissions.paidAmount': 'Tahsil Edilen',
    'admin.commissions.confirmedAmount': 'Onaylanan',
    'admin.commissions.paidOut': 'Ödenen',
    'admin.commissions.allStatuses': 'Tüm Komisyon Durumları',
    'admin.commissions.confirmBtn': 'Onayla',
    'admin.commissions.colCommissionId': 'Komisyon ID',
    'admin.commissions.colJobQuotation': 'İş / Teklif',
    'admin.commissions.colJobId': 'İş ID',
    'admin.commissions.colAgency': 'Acente',
    'admin.commissions.colTraveller': 'Gezgin',
    'admin.commissions.colBookingAmount': 'Rezervasyon Tutarı',
    'admin.commissions.colRate': 'Oran',
    'admin.commissions.colCommission': 'Komisyon',
    'admin.commissions.colStatus': 'Durum',
    'admin.commissions.colDate': 'Tarih',
    'admin.commissions.markAsPaid': 'Tahsil Edildi İşaretle',
    'admin.commissions.loading': 'Komisyon kayıtları yükleniyor...',
    'admin.commissions.empty': 'Komisyon kaydı bulunamadı.',

    // Admin Travel Requests
    'admin.travelRequests.title': 'Seyahat Talepleri (Operasyonel Görünüm)',
    'admin.travelRequests.subtitle': 'Gezgin rotalarının ve iletilen seyahat taleplerinin salt-okunur operasyonel denetimi.',
    'admin.travelRequests.allStatuses': 'Tüm Talep Durumları',
    'admin.travelRequests.colRequestId': 'Talep ID',
    'admin.travelRequests.colTraveller': 'Gezgin',
    'admin.travelRequests.colDestination': 'Rota / Destinasyonlar',
    'admin.travelRequests.colDates': 'Seyahat Tarihleri',
    'admin.travelRequests.colPartySize': 'Kişi Sayısı',
    'admin.travelRequests.colPackage': 'Paket',
    'admin.travelRequests.colQuotes': 'Teklifler',
    'admin.travelRequests.colStatus': 'Durum',
    'admin.travelRequests.colCreatedAt': 'İletilme Tarihi',
    'admin.travelRequests.travellerCount': '{count} kişi',
    'admin.travelRequests.quotesCount': '{count} teklif',
    'admin.travelRequests.noRequests': 'Seyahat talebi bulunamadı.',
    'admin.travelRequests.loadingRequests': 'Seyahat talepleri yükleniyor...',

    // Admin Jobs
    'admin.jobs.title': 'Pazaryeri İşleri (Operasyonel Görünüm)',
    'admin.jobs.subtitle': 'Onaylanan ve kabul edilen pazaryeri rezervasyonlarının operasyonel takibi.',
    'admin.jobs.allStatuses': 'Tüm İş Durumları',
    'admin.jobs.colJobId': 'İş ID',
    'admin.jobs.colAgency': 'Acente',
    'admin.jobs.colTraveller': 'Gezgin',
    'admin.jobs.colPrice': 'Anlaşılan Tutar',
    'admin.jobs.colQuotationTotal': 'Teklif Toplamı',
    'admin.jobs.colStatus': 'Durum',
    'admin.jobs.colDate': 'Kabul Tarihi',
    'admin.jobs.noJobs': 'Seçilen filtreye uygun iş bulunamadı.',
    'admin.jobs.loadingJobs': 'İşler yükleniyor...',

    // Admin Audit Logs
    'admin.auditLogs.title': 'Yönetici Denetim Kayıtları',
    'admin.auditLogs.subtitle': 'Yönetici durum değişikliklerinin, onayların ve müdahalelerin değiştirilemez denetim kaydı.',
    'admin.auditLogs.filterAction': 'İşleme göre filtrele (örn. agency.approved)...',
    'admin.auditLogs.allEntities': 'Tüm Varlık Tipleri',
    'admin.auditLogs.colTimestamp': 'Zaman',
    'admin.auditLogs.colAdmin': 'Yönetici / İşlem Yapan',
    'admin.auditLogs.colAction': 'İşlem',
    'admin.auditLogs.colEntity': 'Varlık',
    'admin.auditLogs.colDetails': 'Detaylar / Veri',
    'admin.auditLogs.noLogs': 'Denetim kaydı bulunamadı.',
    'admin.auditLogs.loadingLogs': 'Denetim kayıtları yükleniyor...',
    'admin.auditLogs.inspectPayload': 'Veriyi İncele',
    'admin.auditLogs.modalTitle': 'Denetim Kaydı Detayı',
    'admin.auditLogs.colActor': 'İşlem Yapan',
    'admin.auditLogs.colTargetEntity': 'Hedef Varlık',
    'admin.auditLogs.colIpAddress': 'IP Adresi',
    'admin.auditLogs.colStateDiff': 'Durum Farkı (Diff)',
    'admin.auditLogs.inspectJson': 'JSON İncele',
    'admin.auditLogs.beforeState': 'Önceki Durum:',
    'admin.auditLogs.afterState': 'Sonraki Durum:',
    'admin.auditLogs.systemPublic': 'Sistem / Genel',
    'admin.auditLogs.entityAgency': 'Acente',
    'admin.auditLogs.entityDocument': 'Belge',
    'admin.auditLogs.entityMembership': 'Üyelik',
    'admin.auditLogs.entityCommission': 'Komisyon',
    'admin.auditLogs.entityMembershipPlan': 'Üyelik Planı',

    // Admin Auth
    'admin.auth.brandBadge': 'YÖNETİCİ PANELİ',
    'admin.auth.loginTitle': 'Yönetici Girişi',
    'admin.auth.loginSubtitle': 'Yetkili çalışma alanı. Yalnızca yetkili personel erişebilir.',
    'admin.auth.emailLabel': 'Yönetici E-posta',
    'admin.auth.passwordLabel': 'Şifre',
    'admin.auth.emailPlaceholder': 'admin@quotemetrip.com',
    'admin.auth.signInButton': 'Yönetici Konsoluna Giriş Yap',
    'admin.auth.securityNotice': 'Şifrelenmiş yönetici oturumu. Sistem etkinlikleri güvenlik denetimleri için izlenir ve kaydedilir.',
    'admin.auth.validEmailError': 'Geçerli bir e-posta adresi giriniz.',
    'admin.auth.passwordRequiredError': 'Şifrenizi giriniz.',

    // Admin Announcements
    'admin.announcements.eyebrow': 'İletişim & Duyurular',
    'admin.announcements.title': 'Duyuru Merkezi',
    'admin.announcements.subtitle': 'Gezginlere ve seyahat acentelerine doğrudan uygulama içi bildirimler, bakım duyuruları ve güncellemeler iletin.',
    'admin.announcements.newAnnouncement': 'Yeni Duyuru',
    'admin.announcements.totalBroadcasts': 'Toplam Duyuru',
    'admin.announcements.activePublished': 'Aktif / Yayınlandı',
    'admin.announcements.travellerCampaigns': 'Gezgin Kampanyaları',
    'admin.announcements.agencyCampaigns': 'Acente Kampanyaları',
    'admin.announcements.searchPlaceholder': 'Başlık veya anahtar kelimelere göre filtrele...',
    'admin.announcements.audienceAll': 'Hedef Kitle: Tümü',
    'admin.announcements.audienceTravellers': 'Yalnızca Gezginler',
    'admin.announcements.audienceAgencies': 'Yalnızca Acenteler',
    'admin.announcements.audienceBoth': 'Tüm Kullanıcılar',
    'admin.announcements.statusAll': 'Durum: Tümü',
    'admin.announcements.statusPublished': 'Yayınlandı',
    'admin.announcements.statusDraft': 'Taslak',
    'admin.announcements.statusWithdrawn': 'Geri Çekildi',
    'admin.announcements.statusExpired': 'Süresi Doldu',
    'admin.announcements.loading': 'Duyurular yükleniyor...',
    'admin.announcements.emptyTitle': 'Duyuru bulunamadı',
    'admin.announcements.emptyDesc': 'Filtrelerinize uygun duyuru bulunamadı. Filtreleri temizlemeyi deneyin.',
    'admin.announcements.emptyAllDesc': 'Gezginlere ve acentelere sistem haberleri veya acil güncellemeler iletmek için yeni bir duyuru oluşturun.',
    'admin.announcements.colType': 'Tür',
    'admin.announcements.colContent': 'Duyuru İçeriği',
    'admin.announcements.colTarget': 'Hedef Kitle',
    'admin.announcements.colStatus': 'Durum',
    'admin.announcements.colPublished': 'Yayınlanma',
    'admin.announcements.colStats': 'İstatistikler',
    'admin.announcements.colActions': 'İşlemler',
    'admin.announcements.notPublished': 'Yayınlanmadı',
    'admin.announcements.viewStats': 'Görüntüle',
    'admin.announcements.previewTitle': 'Bildirimi Önizle',
    'admin.announcements.publishTitle': 'Duyuruyu Yayınla',
    'admin.announcements.withdrawTitle': 'Duyuruyu Geri Çek',
    'admin.announcements.editTitle': 'Duyuruyu Düzenle',
    'admin.announcements.deleteTitle': 'Duyuruyu Sil',
    'admin.announcements.pageOf': 'Sayfa {page} / {totalPages} ({totalItems} duyuru)',

    // Route Planning Workspace
    'route.step1Header': '1. Adım: Karayolu Rotasını Tasarla ve Hesapla',
    'route.heading': 'Nereye seyahat etmek istersiniz?',
    'route.clearRoute': 'Rotayı Temizle',
    'route.subtitle':
      'Başlangıç şehrinizi, güzergah üzerindeki ara durakları ve varış noktanızı ekleyin. Google Haritalar rota motorumuz gerçek sürüş mesafesini, tahmini otoyol seyahat süresini ve önerilen gezi günlerini hesaplar.',
    'route.addDestination': 'Destinasyon Ekle',
    'route.placesAutocomplete': 'Google Yerler Otomatik Tamamlama',
    'route.searchPlaceholder': 'Şehir arayın (örn. İstanbul, Bodrum)...',
    'route.startLocationNum': '1. Başlangıç Noktası',
    'route.startLocation': 'Başlangıç Noktası',
    'route.intermediateStop': 'Ara Durak',
    'route.finalDestination': 'Varış Noktası',
    'route.add': 'Ekle',
    'route.selectFromSuggestions': 'Lütfen önerilerden bir destinasyon arayıp seçin.',
    'route.selectedDestinations': 'Seçilen Destinasyonlar ({count})',
    'route.adjustOrder': 'Sıralamayı oklarla değiştirebilirsiniz',
    'route.noDestinations': 'Henüz destinasyon eklenmedi',
    'route.noDestinationsDesc':
      'Kişiselleştirilmiş yol seyahatinizi oluşturmaya başlamak için yukarıdan başlangıç noktanızı arayın.',
    'route.badgeStart': 'BAŞLANGIÇ',
    'route.badgeStop': 'DURAK',
    'route.badgeFinal': 'VARIŞ',
    'route.calculating': 'Google Karayolu Rotası Hesaplanıyor...',
    'route.minStops': 'Rota hesaplamak için en az 2 destinasyon ekleyin',
    'route.recalculate': 'Rotayı Yeniden Hesapla ({count} durak)',
    'route.calculated': 'Rota Hesaplandı · Yeniden Hesapla ({count} durak)',
    'route.calculate': 'Rotayı Hesapla ({count} durak)',
    'route.journeySummary': 'Karayolu Seyahat Özeti',
    'route.airJourneySummary': 'Hava Seyahati Özeti (Kuş Uçuşu)',
    'route.walkJourneySummary': 'Yürüyüş Seyahat Özeti',
    'route.cycleJourneySummary': 'Bisiklet Seyahati Özeti',
    'route.motoJourneySummary': 'Motosiklet Seyahat Özeti',
    'route.transitJourneySummary': 'Toplu Taşıma Seyahat Özeti',
    'route.modeRouteCalculated': '{mode} Rotası Hesaplandı',
    'route.hours': '{count} sa',
    'route.hoursPlural': '{count} sa',
    'route.mins': '{count} dk',
    'route.minsPlural': '{count} dk',
    'route.updateNeeded': 'Güncelleme Gerekli',
    'route.routesCalculated': 'Google Rotaları Hesaplandı',
    'route.stopsConfigured': 'Duraklar Yapılandırıldı',
    'route.roadDistance': 'Karayolu Mesafesi',
    'route.drivingTime': 'Sürüş Süresi',
    'route.destinations': 'Destinasyonlar',
    'route.stopsCount': 'Durak',
    'route.recommended': 'Önerilen',
    'route.staleWarning':
      'Duraklar değişti — karayolu rotasını ve metrikleri yenilemek için yeniden hesaplayın.',
    'route.recalculateBtn': 'Yeniden Hesapla',
    'route.legBreakdown': 'Ayrıntılı Güzergah Kolları ({count} bölüm)',

    // About Page Content
    'about.breadcrumbs': 'Hakkımızda',
    'about.mission':
      'QuoteMeTrip, çok duraklı seyahat planlamasındaki temel bir sorunu çözmek için kuruldu: gezginin özgün rota vizyonu ile fahiş fiyatlı aracılar olmadan bunu kusursuzca hayata geçirecek yerel uzmanlık arasındaki köprüyü kurmak.',
    'about.howWeHelp': 'Gezginlere Nasıl Yardımcı Oluyoruz',
    'about.feature1Title': 'Önce Rota Seyahat Planlayıcı',
    'about.feature1Desc':
      'İstanbul, Kapadokya ve Turkuaz Kıyı boyunca özel çok duraklı rotalar oluşturun; otomatik mesafe hesaplama ve önerilen gün dağılımından yararlanın.',
    'about.feature2Title': 'Rekabetçi Acente Teklifleri',
    'about.feature2Desc':
      'Özel seyahat gereksinimlerinize ve bütçenize göre uyarlanmış ayrıntılı teklifleri doğrudan lisanslı yerel tur operatörlerinden alın.',
    'about.feature3Title': 'Güvenli Doğrudan Mesajlaşma',
    'about.feature3Desc':
      'Kalemleri ayarlamak, rotaları netleştirmek ve seyahat düzenlemelerini onaylamak için doğrudan acente ortaklarıyla sohbet edin.',
    'about.feature4Title': 'Gezginler İçin Sıfır Platform Ücreti',
    'about.feature4Desc':
      'Gezginler QuoteMeTrip’e asla rezervasyon ücreti ödemez. Seçtiğiniz acenteye doğrudan kendi güvenli faturası üzerinden ödeme yaparsınız.',

    // Agency Detail Page
    'agency.about': 'Acente Hakkında',
    'agency.specialtiesServices': 'Uzmanlıklar ve Hizmetler',
    'agency.spokenLanguages': 'Konuşulan Diller',
    'agency.preAcceptanceNotice':
      'Doğrudan iletişim bilgileri, bu acentenin teklifi kabul edildikten sonra açılır.',
    'agency.planTripRequestQuote': 'Tatilini Planla ve Teklif İste →',
    'agency.readyToRequest': 'Teklif İstemeye Hazır mısınız?',
    'agency.readyToRequestSubtitle':
      'Rotanızı hemen oluşturun, eşleşen acenteler özel tekliflerini iletsin.',
    'agency.notFound': 'Acente Bulunamadı',
    'agency.notFoundDesc': 'İstenen acente profili mevcut değil.',
    'agency.backToAgencies': 'Acentelere Dön',

    // Destination Detail Page
    'destination.travelInfo': 'Seyahat Bilgileri',
    'destination.regionLabel': 'Bölge:',
    'destination.countryLabel': 'Ülke:',
    'destination.bestTimeLabel': 'En İyi Ziyaret Zamanı:',
    'destination.availableServices': '{name} İçin Mevcut Seyahat Hizmetleri',
    'destination.availableServicesDesc':
      '{name} için özel seyahat programınıza onaylı yerel hizmetler ekleyin.',
    'destinations.ctaSubtitle':
      'Bu destinasyonu içeren rotanızı oluşturun ve özel acente teklifleri alın.',

    // Route Planner & Trip Builder (Workstream 2)
    'route.step1Header': '1. Adım: Karayolu Rotasını Tasarla ve Hesapla',
    'route.heading': 'Nereye seyahat etmek istersiniz?',
    'route.clearRoute': 'Rotayı Temizle',
    'route.subtitle': 'Başlangıç şehrinizi, güzergah üzerindeki ara durakları ve varış noktanızı ekleyin. Google Haritalar rota motorumuz gerçek sürüş mesafesini, tahmini otoyol seyahat süresini ve önerilen gezi günlerini hesaplar.',
    'route.travelMode': 'Seyahat Modu',
    'route.modeDrive': 'Sürüş',
    'route.modeDriveHint': 'Otoyol ve karayolu rotası',
    'route.modeMoto': 'Motosiklet',
    'route.modeMotoHint': 'İki tekerlekli güzergahı',
    'route.modeWalk': 'Yürüyüş',
    'route.modeWalkHint': 'Yaya güzergahı',
    'route.modeCycle': 'Bisiklet',
    'route.modeCycleHint': 'Bisiklet yolları',
    'route.modeTransit': 'Toplu Taşıma',
    'route.modeTransitHint': 'Toplu taşıma (2 durak)',
    'route.modeAir': 'Hava Yolu',
    'route.modeAirHint': 'Kuş uçuşu büyük çember rotası',
    'route.addDestination': 'Destinasyon Ekle',
    'route.placesAutocomplete': 'Google Yerler Otomatik Tamamlama',
    'route.searchPlaceholder': 'Şehir arayın (örn. İstanbul, Bodrum)...',
    'route.startLocationNum': '1. Başlangıç Noktası',
    'route.intermediateStop': 'Ara Durak',
    'route.finalDestination': 'Varış Noktası',
    'route.startLocation': 'Başlangıç Noktası',
    'route.add': 'Ekle',
    'route.selectFromSuggestions': 'Lütfen önerilerden bir destinasyon arayın ve seçin.',
    'route.selectedDestinations': 'Seçilen Destinasyonlar ({count})',
    'route.adjustOrder': 'Sıralamayı oklarla değiştirebilirsiniz',
    'route.noDestinations': 'Henüz destinasyon eklenmedi',
    'route.noDestinationsDesc': 'Kişiselleştirilmiş seyahatinizi oluşturmaya başlamak için yukarıdan başlangıç noktanızı arayın.',
    'route.badgeStart': 'BAŞLANGIÇ',
    'route.badgeFinal': 'VARIŞ',
    'route.badgeStop': 'ARA DURAK',
    'route.calculatingAir': 'Kuş Uçuşu Hava Rotası Hesaplanıyor...',
    'route.calculatingMode': 'Google {mode} Rotası Hesaplanıyor...',
    'route.minStops': 'Rotayı hesaplamak için en az 2 destinasyon ekleyin',
    'route.recalculate': 'Rotayı Yeniden Hesapla ({count} durak)',
    'route.calculated': 'Rota Hesaplandı · Yeniden Hesapla ({count} durak)',
    'route.calculate': 'Rotayı Hesapla ({count} durak)',
    'route.continueToStep2': 'Seyahat Detaylarına Devam Et (2. Adım) →',
    'route.airRoutePreview': 'Kuş Uçuşu Hava Rotası Önizlemesi',
    'route.roadRoutePreview': 'Google Haritalar Rota Önizlemesi ({mode})',
    'route.geodesic': 'Jeodezik Büyük Çember',
    'route.interactiveRoad': 'Etkileşimli Karayolu Geometrisi',
    'route.roadDistance': 'Karayolu Mesafesi',
    'route.drivingTime': 'Sürüş Süresi',
    'route.airDistance': 'Kuş Uçuşu Mesafe',
    'route.airDuration': 'Uçuş Süresi',
    'route.walkDistance': 'Yürüme Mesafesi',
    'route.walkDuration': 'Yürüme Süresi',
    'route.cycleDistance': 'Bisiklet Mesafesi',
    'route.cycleDuration': 'Bisiklet Süresi',
    'route.motoDistance': 'Motosiklet Mesafesi',
    'route.motoDuration': 'Sürüş Süresi',
    'route.transitDistance': 'Toplu Taşıma Mesafesi',
    'route.transitDuration': 'Toplu Taşıma Süresi',
    'route.notApplicable': 'Uygulanamaz (Kuş Uçuşu)',
    'route.destinations': 'Destinasyonlar',
    'route.stopsCount': '{count} Durak',
    'route.recommendedDays': 'Önerilen',
    'route.daysCount': '{count} Gün',
    'route.detailedLegs': 'Ayrıntılı Güzergah Kolları ({count} bölüm)',
    'route.summaryAirNotice': 'Hava modu, hedefler arasındaki kuş uçuşu mesafeyi gösterir. Gerçek uçuş güzergahları ve havayolları değişiklik gösterebilir.',

    // Admin Announcements & Notifications (Workstream 3)
    'announcements.title': 'Duyuru Merkezi',
    'announcements.subtitle': 'Gezginlere ve acentelere duyuru, güncelleme ve bakım bildirimleri yayınlayın.',
    'announcements.create': 'Yeni Duyuru Oluştur',
    'announcements.targetAudience': 'Hedef Kitle',
    'announcements.audienceAll': 'Tüm Kullanıcılar (Gezginler ve Acenteler)',
    'announcements.audienceTravellers': 'Yalnızca Gezginler',
    'announcements.audienceAgencies': 'Yalnızca Acenteler',
    'announcements.typeGeneral': 'Genel Duyuru',
    'announcements.typeInfo': 'Bilgilendirme',
    'announcements.typeMaintenance': 'Sistem Bakımı',
    'announcements.typeImportant': 'Önemli Bildirim',
    'announcements.typeUrgent': 'Acil Duyuru',
    'announcements.publish': 'Duyuruyu Yayınla',
    'announcements.withdraw': 'Yayından Kaldır',
    'announcements.confirmPublish': 'Duyuruyu Yayınlamayı Onayla',
    'announcements.publishedSuccess': 'Duyuru başarıyla yayınlandı ve alıcılara iletildi.',
    'announcements.withdrawnSuccess': 'Duyuru yayından kaldırıldı.',
    'announcements.statsDelivered': 'İletilen',
    'announcements.statsRead': 'Okunan',
    'announcements.statsRate': 'Okunma Oranı',
    'announcements.actionLink': 'Bağlantı Linki',
    'announcements.expiryDate': 'Son Geçerlilik Tarihi',
    'announcements.detailModalTitle': 'Duyuru Detayları',
    'announcements.publishedAt': 'Yayın Tarihi',
    'announcements.expiresOn': 'Son Geçerlilik',
    'announcements.status': 'Durum',
    'announcements.read': 'Okundu',
    'announcements.unread': 'Okunmadı',
    'announcements.close': 'Kapat',
    'announcements.actionButton': 'Bağlantıyı Aç',
    'announcements.loading': 'Duyuru yükleniyor...',
    'announcements.errorLoading': 'Duyuru detayları yüklenemedi.',
    'announcements.notFound': 'Duyuru bulunamadı veya artık geçerli değil.',
    'announcements.priority': 'Öncelik',
  },
};

/**
 * Format string with interpolation variables.
 * E.g., t('dashboard.welcome', { name: 'Ali', timeOfDay: 'morning' })
 */
function interpolate(template, params) {
  if (!params || typeof params !== 'object') {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * Translate key with fallback and interpolation.
 * Usage:
 *   t('header.home')
 *   t('dashboard.welcome', { name: 'Alice', timeOfDay: 'morning' })
 *   t('custom.key', 'Default text')
 *   t('custom.key', { name: 'Alice' }, 'Default text')
 */
export function t(key, paramsOrFallback = null, explicitFallback = null) {
  let params = null;
  let fallback = null;

  if (paramsOrFallback && typeof paramsOrFallback === 'object') {
    params = paramsOrFallback;
    fallback = explicitFallback;
  } else if (typeof paramsOrFallback === 'string') {
    fallback = paramsOrFallback;
  }

  const locale = DEFAULT_LOCALE;
  const currentCatalog = TRANSLATIONS[locale] || TRANSLATIONS[DEFAULT_LOCALE];
  const raw = currentCatalog[key] ?? TRANSLATIONS[DEFAULT_LOCALE][key] ?? fallback ?? key;

  return params ? interpolate(raw, params) : raw;
}

/**
 * Translate helper bound to a specific locale.
 */
export function translateWithLocale(key, locale, paramsOrFallback = null, explicitFallback = null) {
  let params = null;
  let fallback = null;

  if (paramsOrFallback && typeof paramsOrFallback === 'object') {
    params = paramsOrFallback;
    fallback = explicitFallback;
  } else if (typeof paramsOrFallback === 'string') {
    fallback = paramsOrFallback;
  }

  const activeLocale = SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const currentCatalog = TRANSLATIONS[activeLocale] || TRANSLATIONS[DEFAULT_LOCALE];
  const raw = currentCatalog[key] ?? TRANSLATIONS[DEFAULT_LOCALE][key] ?? fallback ?? key;

  return params ? interpolate(raw, params) : raw;
}

/**
 * Locale-aware currency formatting.
 */
export function formatCurrency(amount, currency = 'TRY', locale = DEFAULT_LOCALE) {
  const num = Number(amount) || 0;
  const activeLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  try {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency.toUpperCase()} ${num.toFixed(2)}`;
  }
}

/**
 * Locale-aware date formatting.
 */
export function formatDate(date, locale = DEFAULT_LOCALE, options = { dateStyle: 'medium' }) {
  if (!date) return '';
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);

  const activeLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  try {
    return new Intl.DateTimeFormat(activeLocale, options).format(parsed);
  } catch {
    return parsed.toLocaleDateString();
  }
}

/**
 * Locale-aware number formatting.
 */
export function formatNumber(value, locale = DEFAULT_LOCALE, options = {}) {
  const num = Number(value) || 0;
  const activeLocale = locale === 'tr' ? 'tr-TR' : 'en-US';
  try {
    return new Intl.NumberFormat(activeLocale, options).format(num);
  } catch {
    return String(num);
  }
}

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, params, fallback) => translateWithLocale(key, DEFAULT_LOCALE, params, fallback),
  formatCurrency: (amount, currency) => formatCurrency(amount, currency, DEFAULT_LOCALE),
  formatDate: (date, options) => formatDate(date, DEFAULT_LOCALE, options),
  formatNumber: (val, options) => formatNumber(val, DEFAULT_LOCALE, options),
});

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }) {
  const [locale, setLocale] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('tf_locale') : null;
      return SUPPORTED_LOCALES.includes(saved) ? saved : initialLocale;
    } catch {
      return initialLocale;
    }
  });

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'tf_locale' && e.newValue && SUPPORTED_LOCALES.includes(e.newValue)) {
        setLocale(e.newValue);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const changeLocale = (nextLocale) => {
    if (SUPPORTED_LOCALES.includes(nextLocale)) {
      setLocale(nextLocale);
      try {
        localStorage.setItem('tf_locale', nextLocale);
      } catch {
        // storage disabled or SSR
      }
    }
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale: changeLocale,
      t: (key, params, fallback) => translateWithLocale(key, locale, params, fallback),
      formatCurrency: (amount, currency) => formatCurrency(amount, currency, locale),
      formatDate: (date, options) => formatDate(date, locale, options),
      formatNumber: (val, options) => formatNumber(val, locale, options),
    }),
    [locale],
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}

// Client-side cache for dynamic translations (avoids redundant network roundtrips)
const clientTranslationCache = new Map();

/**
 * Hook to dynamically translate a single content field.
 *
 * When locale is 'en', returns original sourceText immediately without calling backend.
 * When locale is 'tr', checks in-memory cache, then requests backend MySQL cache/Google Cloud Translation.
 */
export function useDynamicTranslation({
  contentType,
  contentId,
  fieldName,
  sourceText = '',
  apiClient = null,
}) {
  const { locale } = useI18n();
  const [translatedText, setTranslatedText] = useState(sourceText);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If target locale is English (source default), return original text immediately
    if (locale === 'en' || !sourceText) {
      setTranslatedText(sourceText);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = `${contentType}:${contentId}:${fieldName}:${locale}:${sourceText}`;
    if (clientTranslationCache.has(cacheKey)) {
      setTranslatedText(clientTranslationCache.get(cacheKey));
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchTranslation = async () => {
      try {
        let result = null;
        if (apiClient && apiClient.translationApi) {
          result = await apiClient.translationApi.translateContent({
            contentType,
            contentId: String(contentId),
            fieldName,
            sourceText,
            targetLanguage: locale,
          });
        } else {
          // Direct fetch fallback using relative API path
          const res = await fetch('/api/v1/translations/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentType,
              contentId: String(contentId),
              fieldName,
              sourceText,
              targetLanguage: locale,
            }),
          });
          if (!res.ok) {
            throw new Error(`Translation failed with HTTP ${res.status}`);
          }
          const json = await res.json();
          result = json?.data;
        }

        if (isMounted && result?.text) {
          clientTranslationCache.set(cacheKey, result.text);
          setTranslatedText(result.text);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          // Graceful fallback to source text so the UI never breaks
          setTranslatedText(sourceText);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTranslation();

    return () => {
      isMounted = false;
    };
  }, [contentType, contentId, fieldName, sourceText, locale, apiClient]);

  return { text: translatedText, loading, error };
}

/**
 * Hook to translate batches of items (e.g. lists of destination cards or travel guides).
 */
export function useBatchDynamicTranslation({ items = [], apiClient = null }) {
  const { locale } = useI18n();
  const [translationsMap, setTranslationsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const itemsKey = useMemo(
    () => (items || []).map((i) => `${i.contentType}:${i.contentId}:${i.fieldName}:${i.sourceText}`).join('||'),
    [items],
  );

  useEffect(() => {
    if (locale === 'en' || !items || items.length === 0) {
      setTranslationsMap({});
      setLoading(false);
      return;
    }

    const missingItems = [];
    const newMap = { ...translationsMap };

    for (const item of items) {
      const key = `${item.contentType}:${item.contentId}:${item.fieldName}`;
      const cacheKey = `${key}:${locale}:${item.sourceText}`;
      if (clientTranslationCache.has(cacheKey)) {
        newMap[key] = clientTranslationCache.get(cacheKey);
      } else {
        missingItems.push(item);
      }
    }

    if (missingItems.length === 0) {
      setTranslationsMap(newMap);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchBatch = async () => {
      try {
        let results = null;
        const payloadItems = missingItems.map((m) => ({
          contentType: m.contentType,
          contentId: String(m.contentId),
          fieldName: m.fieldName,
          sourceText: m.sourceText,
          targetLanguage: locale,
        }));

        if (apiClient && apiClient.translationApi) {
          results = await apiClient.translationApi.translateBatch({
            items: payloadItems,
            targetLanguage: locale,
          });
        } else {
          const res = await fetch('/api/v1/translations/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: payloadItems, targetLanguage: locale }),
          });
          if (!res.ok) {
            throw new Error(`Batch translation failed with HTTP ${res.status}`);
          }
          const json = await res.json();
          results = json?.data;
        }

        if (isMounted && results?.items) {
          const updated = { ...newMap };
          for (const resItem of results.items) {
            const key = `${resItem.contentType}:${resItem.contentId}:${resItem.fieldName}`;
            const matchingSource = missingItems.find(
              (m) =>
                m.contentType === resItem.contentType &&
                String(m.contentId) === String(resItem.contentId) &&
                m.fieldName === resItem.fieldName,
            );
            const sourceText = matchingSource ? matchingSource.sourceText : '';
            const cacheKey = `${key}:${locale}:${sourceText}`;
            clientTranslationCache.set(cacheKey, resItem.text);
            updated[key] = resItem.text;
          }
          setTranslationsMap(updated);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBatch();

    return () => {
      isMounted = false;
    };
  }, [itemsKey, locale, apiClient]);

  const getTranslated = (contentType, contentId, fieldName, defaultText = '') => {
    if (locale === 'en') return defaultText;
    const key = `${contentType}:${contentId}:${fieldName}`;
    return translationsMap[key] || defaultText;
  };

  return { getTranslated, translationsMap, loading, error };
}
