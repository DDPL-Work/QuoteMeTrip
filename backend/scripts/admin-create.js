/**
 * Provision an admin account (Phase 3).
 *
 *   npm run admin:create --workspace=@troublefree/backend
 *
 * Credentials come ONLY from the environment (or CLI flags) — there
 * are no default credentials and no public admin registration
 * endpoint. Required: ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD.
 */
import 'dotenv/config';
import { getSequelize, closeDatabase } from '../src/db/sequelize.js';
import { initModels } from '../src/db/models/index.js';
import { migrateUp } from '../src/db/runner.js';
import { createAdminUser } from '../src/modules/auth/auth.service.js';

function flagValue(name) {
  const flag = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return flag ? flag.slice(name.length + 3) : undefined;
}

try {
  const sequelize = getSequelize();
  initModels(sequelize);
  await migrateUp(sequelize);

  const user = await createAdminUser({
    email: flagValue('email') || process.env.ADMIN_EMAIL,
    name: flagValue('name') || process.env.ADMIN_NAME,
    password: flagValue('password') || process.env.ADMIN_PASSWORD,
  });

  // Never print secrets — only the provisioned identity.
  console.log(`Admin provisioned: id=${user.id} email=${user.email} role=${user.role}`);
} catch (err) {
  console.error(`admin:create failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
