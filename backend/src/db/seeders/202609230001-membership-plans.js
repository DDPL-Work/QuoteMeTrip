/**
 * Seeder: foundation membership plans (development reference data).
 *
 * Idempotent: safe to run multiple times — plans are upserted by
 * their unique `slug`, so re-running never creates duplicates.
 * No users, credentials, or sensitive data are seeded here.
 */
// Model attributes are camelCase; `underscored: true` maps them to
// snake_case columns automatically.
const PLANS = [
  {
    name: 'Basic',
    slug: 'basic',
    description: 'Entry plan for newly onboarded agencies.',
    price: 0.0,
    currency: 'USD',
    durationDays: 30,
    status: 'active',
  },
  {
    name: 'Standard',
    slug: 'standard',
    description: 'Standard plan for growing agencies.',
    price: 49.0,
    currency: 'USD',
    durationDays: 90,
    status: 'active',
  },
  {
    name: 'Premium',
    slug: 'premium',
    description: 'Premium plan with full platform visibility.',
    price: 99.0,
    currency: 'USD',
    durationDays: 365,
    status: 'active',
  },
];

export async function up(sequelize) {
  const { MembershipPlan } = await import('../models/MembershipPlan.js');
  MembershipPlan.initModel(sequelize);

  for (const plan of PLANS) {
    await MembershipPlan.upsert(plan);
  }
}

export async function down(sequelize) {
  const { MembershipPlan } = await import('../models/MembershipPlan.js');
  MembershipPlan.initModel(sequelize);

  await MembershipPlan.destroy({ where: { slug: PLANS.map((plan) => plan.slug) } });
}
