/**
 * Unit tests for Database Configuration and Production Environment Validation.
 *
 * Verifies:
 * 1. Local configuration uses local settings and disables TLS when no CA path is set.
 * 2. Verified TLS configuration loads the CA certificate and sets rejectUnauthorized: true.
 * 3. Production validation rejects missing or nonexistent CA files.
 * 4. Missing production credentials throw clear configuration errors without exposing secrets.
 * 5. Invalid database port numbers are rejected in production.
 * 6. Boot enforcement (requireOnBoot) defaults to true in production and false in development.
 * 7. Existing pool settings, timeouts, and test-database isolation behavior are preserved.
 */
import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getDatabaseConfig, getSslConfig, isTestDatabase } from '../../src/config/database.js';
import { validateEnvironment } from '../../src/config/env.js';

describe('Database Configuration & Environment Validation', () => {
  const originalEnv = { ...process.env };
  let tempDir = null;

  beforeEach(() => {
    // Reset process.env to a clean snapshot before each test
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  afterEach(() => {
    // Clean up any temporary directory created
    if (tempDir) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
      tempDir = null;
    }
    // Restore original env
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  });

  function createTempCert(content = '-----BEGIN CERTIFICATE-----\nFAKECACERT\n-----END CERTIFICATE-----') {
    tempDir = mkdtempSync(join(tmpdir(), 'tfh-db-test-'));
    const certPath = join(tempDir, 'ca.pem');
    writeFileSync(certPath, content, 'utf8');
    return certPath;
  }

  describe('Local development configuration', () => {
    it('uses local port 3307 and does not enable TLS when no CA path is configured', () => {
      process.env.NODE_ENV = 'development';
      process.env.DB_HOST = '127.0.0.1';
      process.env.DB_PORT = '3307';
      process.env.DB_NAME = 'troublefree_holiday';
      process.env.DB_USER = 'root';
      process.env.DB_PASSWORD = 'local_password';
      delete process.env.DB_SSL_CA_PATH;

      const sslConfig = getSslConfig();
      assert.strictEqual(sslConfig, null);

      const config = getDatabaseConfig();
      assert.strictEqual(config.host, '127.0.0.1');
      assert.strictEqual(config.port, 3307);
      assert.strictEqual(config.database, 'troublefree_holiday');
      assert.strictEqual(config.username, 'root');
      assert.strictEqual(config.password, 'local_password');
      assert.strictEqual(config.dialect, 'mysql');
      assert.strictEqual(config.dialectOptions.ssl, undefined);
      assert.strictEqual(config.dialectOptions.connectTimeout, 10000);
      assert.strictEqual(config.requireOnBoot, false);
    });

    it('defaults host to 127.0.0.1 and port to 3306 if unconfigured in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_SSL_CA_PATH;

      const config = getDatabaseConfig();
      assert.strictEqual(config.host, '127.0.0.1');
      assert.strictEqual(config.port, 3306);
    });
  });

  describe('Verified TLS configuration', () => {
    it('loads CA certificate and sets rejectUnauthorized: true when CA path is provided', () => {
      process.env.NODE_ENV = 'development';
      const certPath = createTempCert('-----BEGIN CERTIFICATE-----\nVALID_AIVEN_CA_DATA\n-----END CERTIFICATE-----');
      process.env.DB_SSL_CA_PATH = certPath;

      const sslConfig = getSslConfig();
      assert.ok(sslConfig);
      assert.strictEqual(sslConfig.rejectUnauthorized, true);
      assert.ok(sslConfig.ca.includes('VALID_AIVEN_CA_DATA'));

      const config = getDatabaseConfig();
      assert.ok(config.dialectOptions.ssl);
      assert.strictEqual(config.dialectOptions.ssl.rejectUnauthorized, true);
      assert.ok(config.dialectOptions.ssl.ca.includes('VALID_AIVEN_CA_DATA'));
      assert.strictEqual(config.dialectOptions.connectTimeout, 10000);
    });

    it('refuses unverified connections in production when DB_SSL_CA_PATH is missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DB_SSL_CA_PATH;

      assert.throws(
        () => getDatabaseConfig(),
        /Production database requires verified TLS: DB_SSL_CA_PATH must be configured\./,
      );
    });

    it('throws a clear error if the configured CA path does not exist without leaking credentials', () => {
      process.env.NODE_ENV = 'development';
      process.env.DB_PASSWORD = 'super_secret_password_never_expose';
      process.env.DB_SSL_CA_PATH = join(tmpdir(), 'non_existent_ca_file.pem');

      assert.throws(
        () => getDatabaseConfig(),
        (err) => {
          assert.ok(err.message.includes('Failed to read SSL CA certificate'));
          assert.ok(!err.message.includes('super_secret_password_never_expose'));
          return true;
        },
      );
    });

    it('throws a clear error if the CA certificate file is empty', () => {
      process.env.NODE_ENV = 'development';
      const emptyCertPath = createTempCert('   ');
      process.env.DB_SSL_CA_PATH = emptyCertPath;

      assert.throws(
        () => getDatabaseConfig(),
        (err) => {
          assert.ok(err.message.includes('is empty'));
          return true;
        },
      );
    });
  });

  describe('Production environment validation', () => {
    function setupValidProductionEnv() {
      process.env.NODE_ENV = 'production';
      process.env.JWT_ACCESS_SECRET = 'valid_jwt_access_secret_12345';
      process.env.JWT_REFRESH_SECRET = 'valid_jwt_refresh_secret_12345';
      process.env.DB_HOST = 'quotemetrip-sql-ddpldeveloper-0717.c.aivencloud.com';
      process.env.DB_PORT = '27223';
      process.env.DB_NAME = 'troublefree_holiday';
      process.env.DB_USER = 'avnadmin';
      process.env.DB_PASSWORD = 'aiven_prod_password';
      process.env.DB_SSL_CA_PATH = createTempCert();
    }

    it('passes validation with complete production variables and valid CA certificate', () => {
      setupValidProductionEnv();
      const envInfo = validateEnvironment();

      assert.strictEqual(envInfo.isProduction, true);
      assert.strictEqual(envInfo.nodeEnv, 'production');
    });

    it('rejects missing or empty required database variables without leaking secret values', () => {
      setupValidProductionEnv();
      delete process.env.DB_PASSWORD;
      delete process.env.DB_HOST;

      assert.throws(
        () => validateEnvironment(),
        (err) => {
          assert.ok(err.message.includes('DB_HOST'));
          assert.ok(err.message.includes('DB_PASSWORD'));
          assert.ok(!err.message.includes('aiven_prod_password'));
          return true;
        },
      );
    });

    it('rejects missing DB_SSL_CA_PATH in production', () => {
      setupValidProductionEnv();
      delete process.env.DB_SSL_CA_PATH;

      assert.throws(
        () => validateEnvironment(),
        (err) => {
          assert.ok(err.message.includes('DB_SSL_CA_PATH'));
          return true;
        },
      );
    });

    it('rejects nonexistent DB_SSL_CA_PATH file in production', () => {
      setupValidProductionEnv();
      process.env.DB_SSL_CA_PATH = join(tmpdir(), 'missing_cert_file_12345.pem');

      assert.throws(
        () => validateEnvironment(),
        /DB_SSL_CA_PATH file does not exist/,
      );
    });

    it('rejects invalid DB_PORT values (non-numeric, out-of-range, non-integer)', () => {
      setupValidProductionEnv();

      const invalidPorts = ['0', '-1', '65536', '70000', 'not_a_port', '3306.5', ''];
      for (const invalidPort of invalidPorts) {
        process.env.DB_PORT = invalidPort;
        assert.throws(
          () => validateEnvironment(),
          (err) => {
            assert.ok(err.message.includes('DB_PORT'));
            return true;
          },
          `Expected port ${invalidPort} to be rejected`,
        );
      }
    });

    it('does not require production variables when running in local development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_SSL_CA_PATH;

      assert.doesNotThrow(() => {
        const envInfo = validateEnvironment();
        assert.strictEqual(envInfo.isProduction, false);
      });
    });

    it('preserves provider flags in validation output', () => {
      process.env.NODE_ENV = 'development';
      process.env.WEATHER_API_KEY = 'weather_key';
      process.env.GOOGLE_CLIENT_ID = 'google_client_id';
      delete process.env.SMTP_HOST;
      delete process.env.SMS_API_KEY;
      delete process.env.FIREBASE_PROJECT_ID;

      const envInfo = validateEnvironment();
      assert.strictEqual(envInfo.providers.weather, true);
      assert.strictEqual(envInfo.providers.googleAuth, true);
      assert.strictEqual(envInfo.providers.email, false);
      assert.strictEqual(envInfo.providers.sms, false);
      assert.strictEqual(envInfo.providers.firebase, false);
    });
  });

  describe('Boot enforcement & existing behavior retention', () => {
    it('sets requireOnBoot to true by default in production and false in development', () => {
      process.env.NODE_ENV = 'production';
      process.env.DB_SSL_CA_PATH = createTempCert();
      assert.strictEqual(getDatabaseConfig().requireOnBoot, true);

      process.env.NODE_ENV = 'development';
      delete process.env.DB_SSL_CA_PATH;
      assert.strictEqual(getDatabaseConfig().requireOnBoot, false);

      process.env.DB_REQUIRE_ON_BOOT = 'false';
      assert.strictEqual(getDatabaseConfig().requireOnBoot, false);

      process.env.DB_REQUIRE_ON_BOOT = 'true';
      assert.strictEqual(getDatabaseConfig().requireOnBoot, true);
    });

    it('preserves test database isolation when NODE_ENV=test', () => {
      process.env.NODE_ENV = 'test';
      process.env.DB_NAME = 'troublefree_holiday';
      process.env.DB_TEST_NAME = 'custom_test_db';
      delete process.env.DB_SSL_CA_PATH;

      const config = getDatabaseConfig();
      assert.strictEqual(config.database, 'custom_test_db');
      assert.strictEqual(isTestDatabase(), true);
    });

    it('retains connection pool settings and timeout overrides', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.DB_SSL_CA_PATH;
      process.env.DB_POOL_MAX = '20';
      process.env.DB_POOL_MIN = '5';
      process.env.DB_POOL_ACQUIRE = '45000';
      process.env.DB_POOL_IDLE = '15000';
      process.env.DB_CONNECT_TIMEOUT_MS = '12000';

      const config = getDatabaseConfig();
      assert.strictEqual(config.pool.max, 20);
      assert.strictEqual(config.pool.min, 5);
      assert.strictEqual(config.pool.acquire, 45000);
      assert.strictEqual(config.pool.idle, 15000);
      assert.strictEqual(config.dialectOptions.connectTimeout, 12000);
    });
  });
});
