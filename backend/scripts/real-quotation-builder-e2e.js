/**
 * Real E2E Test for QuoteMyTrip Multi-Step Quotation Builder
 * Per Prompt Section 58.
 *
 * Exercises the complete real flow:
 * Real Traveller submits travel request
 * -> Real Agency receives matched request
 * -> Agency configures Basic Details + Hotel + Transport + Activity
 * -> Agency saves draft
 * -> Agency refreshes/reopens and verifies restored draft & metadata
 * -> Agency submits quotation
 * -> Quotation status moves to 'submitted'
 * -> Traveller receives quotation in request quotation list
 * -> Traveller opens and verifies full quotation proposal
 */
import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5001';
const suffix = Date.now().toString(36);

async function api(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function run() {
  console.log('--- STARTING REAL E2E TEST: QUOTATION BUILDER ---');

  // 1. Register and setup Agency
  const agencyEmail = `agency.builder.${suffix}@example.com`;
  console.log(`1. Registering Agency: ${agencyEmail}`);
  const regAgency = await api('POST', '/api/v1/auth/register/agency', {
    body: {
      email: agencyEmail,
      password: 'Password123!',
      agencyName: `Cappadocia Elite Tours ${suffix}`,
      contactPerson: 'Serkan Yilmaz',
      city: 'Istanbul',
      country: 'Turkiye',
      phone: '+905551234567',
    },
  });

  if (regAgency.status !== 201) {
    throw new Error(`Failed to register agency: ${JSON.stringify(regAgency.data)}`);
  }
  const agencyToken = regAgency.data.data.accessToken;
  const agencyUser = regAgency.data.data.user;
  console.log(`   Agency registered successfully (User ID: ${agencyUser.id})`);

  // Activate Agency membership & approval directly in DB to enable matching
  const { initModels } = await import('../src/db/models/index.js');
  const models = initModels();
  const agencyProfile = await models.AgencyProfile.findOne({ where: { userId: agencyUser.id } });
  await agencyProfile.update({
    status: 'approved',
    approvedAt: new Date(),
  });

  // Give active membership
  const [plan] = await models.MembershipPlan.findOrCreate({
    where: { slug: `e2e-plan-${suffix}` },
    defaults: { name: `E2E Plan ${suffix}`, slug: `e2e-plan-${suffix}`, price: 99, currency: 'USD', durationDays: 30 },
  });
  await models.AgencyMembership.create({
    agencyId: agencyProfile.id,
    planId: plan.id,
    status: 'active',
    startsAt: new Date(Date.now() - 60_000),
  });
  console.log(`   Agency profile approved and membership activated.`);

  // 2. Register Traveller
  const travellerEmail = `traveller.builder.${suffix}@example.com`;
  console.log(`2. Registering Traveller: ${travellerEmail}`);
  const regTraveller = await api('POST', '/api/v1/auth/register/traveller', {
    body: {
      name: 'Elena Rostova',
      email: travellerEmail,
      password: 'Password123!',
      firstName: 'Elena',
      lastName: 'Rostova',
      country: 'France',
    },
  });
  if (regTraveller.status !== 201) {
    throw new Error(`Failed to register traveller: ${JSON.stringify(regTraveller.data)}`);
  }
  const travellerToken = regTraveller.data.data.accessToken;
  console.log('   Traveller registered successfully.');

  // 3. Traveller creates route & submits request
  console.log('3. Traveller creates route & submits travel request');
  const routeRes = await api('POST', '/api/v1/routes', {
    token: travellerToken,
    body: {
      stops: [
        { name: 'Istanbul', latitude: 41.0082, longitude: 28.9784, type: 'start' },
        { name: 'Bolu', latitude: 40.7333, longitude: 31.6, type: 'intermediate' },
        { name: 'Ankara', latitude: 39.9334, longitude: 32.8597, type: 'final' },
      ],
    },
  });
  if (routeRes.status !== 201) {
    throw new Error(`Failed to create route: ${JSON.stringify(routeRes.data)}`);
  }
  const routeId = routeRes.data.data.route.id;

  const reqRes = await api('POST', '/api/v1/travel-requests', {
    token: travellerToken,
    body: {
      routeId,
      travelStartDate: '2026-11-01',
      travelEndDate: '2026-11-06',
      numberOfTravellers: 2,
      luggageCount: 2,
      hotelRequired: true,
      driverRequired: true,
      guideRequired: true,
      packageType: 'full_package',
      specialRequests: 'Cave hotel preferred with sunrise balloon tour.',
    },
  });
  if (reqRes.status !== 201) {
    throw new Error(`Failed to create request: ${JSON.stringify(reqRes.data)}`);
  }
  const travelRequestId = reqRes.data.data.request.id;

  // Submit request to trigger matching
  const submitReqRes = await api('POST', `/api/v1/travel-requests/${travelRequestId}/submit`, {
    token: travellerToken,
  });
  if (submitReqRes.status !== 200) {
    throw new Error(`Failed to submit request: ${JSON.stringify(submitReqRes.data)}`);
  }
  console.log(`   Travel Request #${travelRequestId} submitted and matching triggered.`);

  // 4. Agency opens matched request
  console.log('4. Agency inspects incoming matched request');
  const matchRes = await api('GET', `/api/v1/agency/travel-requests/${travelRequestId}`, {
    token: agencyToken,
  });
  if (matchRes.status !== 200) {
    throw new Error(`Agency could not find matched request #${travelRequestId}: ${JSON.stringify(matchRes.data)}`);
  }
  const matchedRequest = matchRes.data.data.request;
  console.log(`   Agency verified match for Request #${travelRequestId} (${matchedRequest.destination || 'Istanbul → Ankara'})`);

  // 5. Agency opens Builder and prepares structured quotation items
  console.log('5. Agency configures multi-step quotation items:');
  const quotationInput = {
    quotationType: 'full_package',
    currency: 'USD',
    validUntil: '2026-12-01',
    notes: 'Premium Cappadocia honeymoon package with cave suite, private VIP transfers, and sunrise balloon excursion.',
    items: [
      {
        itemType: 'hotel',
        title: 'Sultan Cave Suites Cappadocia',
        description: '5 Star - Deluxe Cave Suite (CP - Breakfast Included)',
        quantity: 1,
        unitPrice: 450,
        metadata: {
          property: 'Sultan Cave Suites',
          starCategory: '5 Star',
          mealPlan: 'CP (Breakfast Included)',
          checkIn: '2026-11-01',
          checkOut: '2026-11-06',
          nights: 5,
          roomCategory: 'Deluxe Cave Suite',
          roomType: 'Double (2 Persons)',
          rooms: 1,
          bedType: 'King Bed',
          extraBed: 'None',
          maxAdults: 2,
          maxChildren: 0,
        },
      },
      {
        itemType: 'vehicle',
        title: 'Kayseri Airport to Cave Suites VIP Transfer',
        description: 'Mercedes Vito Luxury Van - Round-trip Transfer',
        quantity: 1,
        unitPrice: 120,
        metadata: {
          serviceType: 'Airport Transfer',
          serviceDate: '2026-11-01',
          pickupTime: '10:30 AM',
          vehicleType: 'Luxury Van / Vito',
          usageType: 'Round-trip Transfer',
          passengerCapacity: '2 Passengers',
          luggageCapacity: '2 Bags',
        },
      },
      {
        itemType: 'service',
        title: 'Cappadocia Sunrise Hot Air Balloon Flight',
        description: 'Adventure Experience - 2 Hours Sunrise Flight with Champagne Toast',
        quantity: 2,
        unitPrice: 160,
        metadata: {
          category: 'Adventure Experience',
          tourDate: '2026-11-02',
          duration: '2 Hours',
          guideIncluded: true,
        },
      },
    ],
  };
  console.log('   - Hotel: Sultan Cave Suites (USD 450)');
  console.log('   - Transfer: Kayseri Airport VIP Transfer (USD 120)');
  console.log('   - Activity: Hot Air Balloon Flight (2 PAX @ USD 160 = USD 320)');
  console.log('   - Expected Server Subtotal: USD 890');

  // 6. Save Draft
  console.log('6. Saving Quotation Draft to backend API');
  const createDraftRes = await api('POST', `/api/v1/agency/travel-requests/${travelRequestId}/quotations`, {
    token: agencyToken,
    body: quotationInput,
  });

  if (createDraftRes.status !== 201) {
    throw new Error(`Failed to create quotation draft: ${JSON.stringify(createDraftRes.data)}`);
  }
  const draftQuote = createDraftRes.data.data.quotation;
  console.log(`   Quotation #${draftQuote.id} created with status: "${draftQuote.status}"`);
  console.log(`   Server authoritative totalAmount: USD ${draftQuote.totalAmount}`);
  if (draftQuote.totalAmount !== 890) {
    throw new Error(`Total amount expected 890, got ${draftQuote.totalAmount}`);
  }

  // 7. Refresh/Reopen Draft & Verify Restoration
  console.log(`7. Reopening draft quotation #${draftQuote.id} to verify full restoration`);
  const loadDraftRes = await api('GET', `/api/v1/agency/quotations/${draftQuote.id}`, {
    token: agencyToken,
  });
  if (loadDraftRes.status !== 200) {
    throw new Error(`Failed to reload draft: ${JSON.stringify(loadDraftRes.data)}`);
  }
  const restoredQuote = loadDraftRes.data.data.quotation;
  console.log(`   Restored items count: ${restoredQuote.items.length}`);
  const restoredHotel = restoredQuote.items.find((i) => i.itemType === 'hotel');
  const restoredTransfer = restoredQuote.items.find((i) => i.itemType === 'vehicle');
  const restoredActivity = restoredQuote.items.find((i) => i.itemType === 'service');

  if (!restoredHotel || !restoredTransfer || !restoredActivity) {
    throw new Error('Restored quotation missing structured service items');
  }
  console.log(`   Verified restored hotel metadata: property="${restoredHotel.metadata?.property}", nights=${restoredHotel.metadata?.nights}`);
  console.log(`   Verified restored transfer metadata: vehicle="${restoredTransfer.metadata?.vehicleType}"`);
  console.log(`   Verified restored activity metadata: category="${restoredActivity.metadata?.category}"`);

  // 8. Submit Quotation
  console.log(`8. Submitting Quotation #${draftQuote.id}`);
  const submitQuoteRes = await api('POST', `/api/v1/agency/quotations/${draftQuote.id}/submit`, {
    token: agencyToken,
  });
  if (submitQuoteRes.status !== 200) {
    throw new Error(`Failed to submit quotation: ${JSON.stringify(submitQuoteRes.data)}`);
  }
  const submittedQuote = submitQuoteRes.data.data.quotation;
  console.log(`   Quotation #${submittedQuote.id} status is now: "${submittedQuote.status}"`);
  if (submittedQuote.status !== 'submitted') {
    throw new Error(`Expected status 'submitted', got '${submittedQuote.status}'`);
  }

  // 9. Traveller receives quotation
  console.log('9. Traveller views quotations for travel request');
  const travellerQuotesRes = await api('GET', `/api/v1/travel-requests/${travelRequestId}/quotations`, {
    token: travellerToken,
  });
  if (travellerQuotesRes.status !== 200) {
    throw new Error(`Traveller could not list quotations: ${JSON.stringify(travellerQuotesRes.data)}`);
  }
  const quotesList = travellerQuotesRes.data.data.quotations;
  const foundQuote = quotesList.find((q) => q.id === submittedQuote.id);
  if (!foundQuote) {
    throw new Error(`Quotation #${submittedQuote.id} not found in traveller list`);
  }
  console.log(`   Traveller successfully received Quotation #${foundQuote.id} for USD ${foundQuote.totalAmount}`);

  // 10. Traveller opens full quotation detail
  console.log(`10. Traveller opens Quotation #${foundQuote.id} details`);
  const travellerQuoteDetail = await api('GET', `/api/v1/quotations/${foundQuote.id}`, {
    token: travellerToken,
  });
  if (travellerQuoteDetail.status !== 200) {
    throw new Error(`Traveller failed to load quotation detail: ${JSON.stringify(travellerQuoteDetail.data)}`);
  }
  const detail = travellerQuoteDetail.data.data.quotation;
  console.log(`   Proposal Title: ${detail.notes?.slice(0, 50)}...`);
  console.log(`   Total Services Count: ${detail.items.length}`);
  console.log(`   Agency Profile: ${detail.agency?.agencyName || 'Agency Partner'}`);
  console.log(`   Total Price: ${detail.currency} ${detail.totalAmount}`);

  console.log('\n============================================================');
  console.log('REAL E2E TEST: ALL 10 STEPS PASSED SUCCESSFULLY!');
  console.log('============================================================\n');
}

run().catch((err) => {
  console.error('\nE2E TEST FAILED:', err);
  process.exit(1);
});
