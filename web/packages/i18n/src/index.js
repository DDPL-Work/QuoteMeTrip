// @troublefree/i18n
//
// Centralized translation catalog for English and Turkish.

import { createContext, useContext, useState, useMemo, createElement } from 'react';

export const SUPPORTED_LOCALES = ['en', 'tr'];
export const DEFAULT_LOCALE = 'en';

export const TRANSLATIONS = {
  en: {
    'header.home': 'Home',
    'header.destinations': 'Destinations',
    'header.travelGuide': 'Travel Guide',
    'header.agencies': 'Agencies',
    'header.about': 'About',
    'header.contact': 'Contact',
    'header.login': 'Sign In',
    'header.register': 'Register',
    'header.planTrip': 'Plan My Trip',
    'header.myTrips': 'My Trips',
    'header.profile': 'Profile',
    'header.signOut': 'Sign Out',

    'home.hero.title': 'PLAN YOUR PERFECT TRIP',
    'home.hero.subtitle':
      'Discover destinations. Build your custom route. Receive competitive quotations from verified local travel agencies.',
    'home.hero.cta': 'Plan My Trip',

    'home.destinations.title': 'Popular Destinations',
    'home.destinations.subtitle':
      "Handpicked travel spots across Turkey's most iconic and breathtaking regions.",
    'home.destinations.viewAll': 'Explore Destinations',

    'home.howItWorks.title': 'How Troublefree Holiday Works',
    'home.howItWorks.subtitle': '4 simple steps from route planning to booked vacation',
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

    'home.whyUs.title': 'Why Troublefree Holiday?',
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

    'home.cta.title': 'Ready to Plan Your Trip?',
    'home.cta.subtitle': 'Build your route now and start receiving competitive agency quotations.',
    'home.cta.button': 'Plan My Trip',

    'destinations.title': 'Explore Destinations',
    'destinations.subtitle': 'Discover inspiring places and start planning your travel route.',
    'destinations.searchPlaceholder': 'Search destinations by name or region...',
    'destinations.planCTA': 'Plan a Trip to',

    'guide.title': 'Travel Guide',
    'guide.subtitle': 'Handcrafted itineraries, regional insights, and essential travel tips.',
    'guide.searchPlaceholder': 'Search travel articles...',

    'agencies.title': 'Travel Agencies',
    'agencies.subtitle': 'Browse verified local operators ready to provide custom trip quotations.',
    'agencies.searchPlaceholder': 'Search agencies by name or city...',

    'about.title': 'About Troublefree Holiday',
    'about.subtitle':
      'Empowering travellers to build custom routes and connect with trusted local agencies.',

    'contact.title': 'Contact Us',
    'contact.subtitle': 'Have questions or feedback? Get in touch with our support team.',
    'contact.name': 'Your Name',
    'contact.email': 'Your Email',
    'contact.subject': 'Subject',
    'contact.message': 'Message',
    'contact.send': 'Send Message',
    'contact.success': 'Thank you! Your message has been sent successfully.',

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
    'footer.copyright': '© Troublefree Holiday. All rights reserved.',

    // Dashboard Phase 3
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

    'dashboard.viewAll': 'View all',
    'dashboard.refresh': 'Refresh',

    'status.draft': 'Draft',
    'status.submitted': 'Submitted',
    'status.accepted': 'Accepted',
    'status.cancelled': 'Cancelled',
    'status.in_progress': 'In Progress',
    'status.completed': 'Completed',

    'trip.package.blue_cruise': 'Blue Cruise',
    'trip.cruiseDuration.title': 'Choose your cruise duration',
    'trip.cruiseDuration.4d_3n': '4 Days / 3 Nights',
    'trip.cruiseDuration.6d_5n': '6 Days / 5 Nights',
    'trip.cruiseDurationRequired': 'Please select a cruise duration.',
  },
  tr: {
    'header.home': 'Anasayfa',
    'header.destinations': 'Destinasyonlar',
    'header.travelGuide': 'Gezi Rehberi',
    'header.agencies': 'Acenteler',
    'header.about': 'Hakkımızda',
    'header.contact': 'İletişim',
    'header.login': 'Giriş Yap',
    'header.register': 'Kayıt Ol',
    'header.planTrip': 'Tatilini Planla',
    'header.myTrips': 'Seyahatlerim',
    'header.profile': 'Profilim',
    'header.signOut': 'Çıkış Yap',

    'home.hero.title': 'KUSURSUZ TATİLİNİ PLANLA',
    'home.hero.subtitle':
      'Destinasyonları keşfet. Rota ve seyahat isteklerini belirle. Onaylı acentelerden teklif al.',
    'home.hero.cta': 'Tatilini Planla',

    'home.destinations.title': 'Popüler Destinasyonlar',
    'home.destinations.subtitle':
      'Türkiye’nin en gözde seyahat rotalarını ve kültürel zenginliklerini keşfedin.',
    'home.destinations.viewAll': 'Tüm Destinasyonları İncele',

    'home.howItWorks.title': 'Troublefree Holiday Nasıl Çalışır?',
    'home.howItWorks.subtitle': 'Hayalinizdeki tatile ulaşmak için 4 kolay adım',
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

    'home.whyUs.title': 'Neden Troublefree Holiday?',
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

    'home.cta.title': 'Seyahatinizi Planlamaya Hazır Mısınız?',
    'home.cta.subtitle': 'Rotanızı hemen oluşturun ve acentelerden teklif almaya başlayın.',
    'home.cta.button': 'Tatilimi Planla',

    'destinations.title': 'Destinasyonları Keşfedin',
    'destinations.subtitle': 'İlham veren yerleri inceleyin ve seyahat rotanızı oluşturun.',
    'destinations.searchPlaceholder': 'Destinasyon veya bölge ara...',
    'destinations.planCTA': 'İçin Rota Planla',

    'guide.title': 'Gezi Rehberi',
    'guide.subtitle': 'Detaylı gezi yazıları, yerel tavsiyeler ve rota fikirleri.',
    'guide.searchPlaceholder': 'Rehber yazılarında ara...',

    'agencies.title': 'Seyahat Acenteleri',
    'agencies.subtitle': 'Size özel seyahat teklifi sunmaya hazır onaylı acenteler.',
    'agencies.searchPlaceholder': 'Acente veya şehir ara...',

    'about.title': 'Troublefree Holiday Hakkında',
    'about.subtitle':
      'Gezginlerin özgürce rota oluşturmasını ve güvenilir acentelerle buluşmasını sağlıyoruz.',

    'contact.title': 'İletişim',
    'contact.subtitle': 'Sorularınız veya geri bildirimleriniz için bize ulaşın.',
    'contact.name': 'Adınız',
    'contact.email': 'E-posta Adresiniz',
    'contact.subject': 'Konu',
    'contact.message': 'Mesajınız',
    'contact.send': 'Mesaj Gönder',
    'contact.success': 'Teşekkürler! Mesajınız başarıyla iletildi.',

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
    'footer.copyright': '© Troublefree Holiday. Tüm hakları saklıdır.',

    // Dashboard Phase 3
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

    'dashboard.viewAll': 'Tümünü gör',
    'dashboard.refresh': 'Yenile',

    'status.draft': 'Taslak',
    'status.submitted': 'Gönderildi',
    'status.accepted': 'Kabul Edildi',
    'status.cancelled': 'İptal Edildi',
    'status.in_progress': 'Devam Ediyor',
    'status.completed': 'Tamamlandı',

    'trip.package.blue_cruise': 'Mavi Tur',
    'trip.cruiseDuration.title': 'Mavi tur sürenizi seçin',
    'trip.cruiseDuration.4d_3n': '4 Gün / 3 Gece',
    'trip.cruiseDuration.6d_5n': '6 Gün / 5 Gece',
    'trip.cruiseDurationRequired': 'Lütfen bir mavi tur süresi seçin.',
  },
};

export function t(key, locale = DEFAULT_LOCALE, fallback = null) {
  const currentCatalog = TRANSLATIONS[locale] || TRANSLATIONS[DEFAULT_LOCALE];
  return currentCatalog[key] ?? TRANSLATIONS[DEFAULT_LOCALE][key] ?? fallback ?? key;
}

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key, fallback) => t(key, DEFAULT_LOCALE, fallback),
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
      t: (key, fallback) => t(key, locale, fallback),
    }),
    [locale],
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}
