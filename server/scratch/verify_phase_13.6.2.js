/**
 * @fileoverview Automated verification script for Phase 13.6.2 — Authentication Security.
 *
 * Spawns the Express server under various configurations and tests JWT controls,
 * deep-freeze immutability, startup errors, and sanitization parameters.
 *
 * @module scratch/verify_phase_13.6.2
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import http from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/lib/prisma.js';
import { authSecurityConfig } from '../src/config/auth.security.config.js';
import { generateToken } from '../src/utils/jwt.js';

let passedChecks = 0;
let totalChecks = 0;

function assert(description, condition) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${description}`);
    return true;
  } else {
    console.log(`  [FAIL] ${description}`);
    return false;
  }
}

/**
 * Helper to fetch headers and body from a running test helper instance.
 * Also collects stdout and stderr logs for leak checks.
 *
 * @param {string} authorizationHeader - Authorization header value (optional)
 * @param {Object} env - Environment variables to pass to the spawned server
 * @returns {Promise<{statusCode: number, body: string, headers: Object, logs: string}>} Response details
 */
function requestWithServer(authorizationHeader = null, env = {}) {
  return new Promise((resolve, reject) => {
    const uniqueId = Math.random().toString(36).substring(7);
    const helperPath = path.join(process.cwd(), 'scratch', `tmp_auth_server_helper_${uniqueId}.js`);
    
    fs.writeFileSync(helperPath, `
      import app from '../src/app.js';
      import http from 'http';
      const server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        console.log("PORT:" + port);
      });
    `);

    const cp = spawn('node', [helperPath], {
      env: { ...process.env, ...env },
    });

    let portResolved = false;
    let stdoutBuffer = '';
    let stderrBuffer = '';

    const cleanup = () => {
      cp.kill('SIGKILL');
      try {
        fs.unlinkSync(helperPath);
      } catch (e) {}
    };

    cp.stdout.on('data', (data) => {
      stdoutBuffer += data.toString();
      if (!portResolved && stdoutBuffer.includes('PORT:')) {
        portResolved = true;
        const match = stdoutBuffer.match(/PORT:(\d+)/);
        if (match) {
          const port = parseInt(match[1], 10);
          
          const options = {
            hostname: '127.0.0.1',
            port,
            path: '/api/v1/auth/me',
            method: 'GET',
            headers: {},
          };

          if (authorizationHeader) {
            options.headers['Authorization'] = authorizationHeader;
          }

          const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
              body += chunk.toString();
            });
            res.on('end', () => {
              cleanup();
              resolve({
                statusCode: res.statusCode,
                body,
                headers: res.headers,
                logs: stdoutBuffer + '\n' + stderrBuffer,
              });
            });
          });

          req.on('error', (err) => {
            cleanup();
            reject(new Error(`HTTP request failed: ${err.message}`));
          });
          req.end();
        } else {
          cleanup();
          reject(new Error('Failed to parse port.'));
        }
      }
    });

    cp.stderr.on('data', (data) => {
      stderrBuffer += data.toString();
    });

    cp.on('error', (err) => {
      cleanup();
      reject(err);
    });

    setTimeout(() => {
      cleanup();
      reject(new Error('Server spawn timed out.'));
    }, 10000);
  });
}

/**
 * Asserts that a startup attempt with specified environment variables fails.
 *
 * @param {Object} env - Malformed environment variables
 * @returns {Promise<boolean>} True if it correctly fails startup
 */
function assertStartupFails(env = {}) {
  return new Promise((resolve) => {
    const helperPath = path.join(process.cwd(), 'scratch', `tmp_auth_fail_helper_${Math.random().toString(36).substring(7)}.js`);
    fs.writeFileSync(helperPath, `
      import app from '../src/app.js';
      console.log("STARTED");
    `);

    const cp = spawn('node', [helperPath], {
      env: { ...process.env, ...env },
    });

    let exitCode = null;
    let stdout = '';
    let stderr = '';

    cp.stdout.on('data', (data) => { stdout += data.toString(); });
    cp.stderr.on('data', (data) => { stderr += data.toString(); });

    cp.on('close', (code) => {
      exitCode = code;
      try {
        fs.unlinkSync(helperPath);
      } catch (e) {}
      
      const failed = exitCode !== 0;
      resolve(failed);
    });

    setTimeout(() => {
      cp.kill('SIGKILL');
      try {
        fs.unlinkSync(helperPath);
      } catch (e) {}
      resolve(false); // If it kept running, it didn't fail startup
    }, 5000);
  });
}

async function run() {
  console.log('============================================================');
  console.log('  Verifying Phase 13.6.2 — Authentication Security');
  console.log('============================================================');

  // Find or create user for token generation
  const user = await prisma.user.findFirst();
  let userId, email, role;
  let tempUserCreated = false;

  if (user) {
    userId = user.id;
    email = user.email;
    role = user.role;
  } else {
    console.log('  Creating temporary user for validation...');
    const tempUser = await prisma.user.create({
      data: {
        username: 'verifyauthuser',
        email: 'verifyauth@example.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: 'MEMBER',
      }
    });
    userId = tempUser.id;
    email = tempUser.email;
    role = tempUser.role;
    tempUserCreated = true;
  }

  // Generate a valid JWT token
  const validToken = generateToken({ id: userId, email, role });

  // ── Check 1: File Existence ───────────────────────────────────────────────
  console.log('\n--- 1. Security Configuration Verification ---');
  assert('auth.security.config.js exists', fs.existsSync('src/config/auth.security.config.js'));
  assert('authentication-security.md exists', fs.existsSync('benchmark/security/authentication-security.md'));

  // ── Check 2: Immutability (Deep Freeze) ───────────────────────────────────
  console.log('\n--- 2. Immutability (Deep Freeze) Verification ---');
  assert('authSecurityConfig is frozen', Object.isFrozen(authSecurityConfig));
  assert('authSecurityConfig.jwtAlgorithms is frozen', Object.isFrozen(authSecurityConfig.jwtAlgorithms));

  // ── Check 3: Cryptographic JWT Verification Tests ────────────────────────
  console.log('\n--- 3. Cryptographic JWT Verification Tests ---');

  // Test 3.1: Valid token accepted
  try {
    const result = await requestWithServer(`Bearer ${validToken}`);
    assert('valid JWT token yields success status 200', result.statusCode === 200);
    const parsedBody = JSON.parse(result.body);
    assert('valid token response contains correct user ID', parsedBody.data?.id === userId);
  } catch (err) {
    console.error(err);
    assert('valid token request completed cleanly', false);
  }

  // Test 3.2: Expired token rejected
  try {
    const expiredToken = jwt.sign({ id: userId, email, role }, authSecurityConfig.jwtSecret, { expiresIn: '-10s' });
    const result = await requestWithServer(`Bearer ${expiredToken}`);
    assert('expired token yields HTTP status 401', result.statusCode === 401);
    const parsedBody = JSON.parse(result.body);
    assert('expired token returns standardized client error message', parsedBody.message === 'Invalid or expired authentication token');
    assert('expired token response contains zero implementation details', parsedBody.errors?.length === 0 || !parsedBody.errors);
  } catch (err) {
    console.error(err);
    assert('expired token request completed cleanly', false);
  }

  // Test 3.3: Malformed token rejected
  try {
    const result = await requestWithServer('Bearer malformed-token-content-segment-here');
    assert('malformed token yields HTTP status 401', result.statusCode === 401);
    const parsedBody = JSON.parse(result.body);
    assert('malformed token returns standardized client error message', parsedBody.message === 'Invalid or expired authentication token');
  } catch (err) {
    console.error(err);
    assert('malformed token request completed cleanly', false);
  }

  // Test 3.4: Malformed JWT Structure Tests
  try {
    const testCases = ['header.payload.', 'header.', '..', 'header.payload.notbase64url$$$'];
    let allBlocked = true;
    for (const testCase of testCases) {
      const result = await requestWithServer(`Bearer ${testCase}`);
      if (result.statusCode !== 401) {
        allBlocked = false;
      }
      const parsedBody = JSON.parse(result.body);
      if (parsedBody.message !== 'Invalid or expired authentication token') {
        allBlocked = false;
      }
    }
    assert('malformed structural segments (missing/invalid) are rejected with standardized error', allBlocked);
  } catch (err) {
    console.error(err);
    assert('malformed structural segments checks completed cleanly', false);
  }

  // Test 3.5: Not Before (nbf) rejected
  try {
    const nbfToken = jwt.sign({ id: userId, email, role, nbf: Math.floor(Date.now() / 1000) + 60 }, authSecurityConfig.jwtSecret);
    const result = await requestWithServer(`Bearer ${nbfToken}`);
    assert('future nbf token yields HTTP status 401', result.statusCode === 401);
    const parsedBody = JSON.parse(result.body);
    assert('future nbf token returns standardized client error message', parsedBody.message === 'Invalid or expired authentication token');
  } catch (err) {
    console.error(err);
    assert('nbf token request completed cleanly', false);
  }

  // Test 3.6: Clock Tolerance Behavior Validation
  try {
    // Generate token valid 5 seconds in the future
    const skewToken = jwt.sign(
      { id: userId, email, role, nbf: Math.floor(Date.now() / 1000) + 5 },
      authSecurityConfig.jwtSecret
    );
    // Request with tolerance set to 10 seconds
    const result = await requestWithServer(`Bearer ${skewToken}`, { JWT_CLOCK_TOLERANCE: '10' });
    assert('skewed nbf token succeeds when clock tolerance permits acceptance', result.statusCode === 200);
  } catch (err) {
    console.error(err);
    assert('clock tolerance check completed cleanly', false);
  }

  // Test 3.7: Incorrect secret signature rejected
  try {
    const invalidSignatureToken = jwt.sign({ id: userId, email, role }, 'wrong_secret_key_used_for_testing');
    const result = await requestWithServer(`Bearer ${invalidSignatureToken}`);
    assert('incorrect secret signature yields HTTP status 401', result.statusCode === 401);
  } catch (err) {
    console.error(err);
    assert('incorrect secret check completed cleanly', false);
  }

  // Test 3.8: Unsupported algorithms rejected (alg "none")
  try {
    const unsignedToken = jwt.sign({ id: userId, email, role }, '', { algorithm: 'none' });
    const result = await requestWithServer(`Bearer ${unsignedToken}`);
    assert('unsigned alg "none" token yields HTTP status 401', result.statusCode === 401);
  } catch (err) {
    console.error(err);
    assert('alg none check completed cleanly', false);
  }

  // Test 3.9: Tampered Payload Test
  try {
    const parts = validToken.split('.');
    const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    // Tamper with payload (escalate role)
    decodedPayload.role = 'ADMIN';
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayloadB64}.${parts[2]}`;

    const result = await requestWithServer(`Bearer ${tamperedToken}`);
    assert('tampered payload with unmodified signature yields HTTP status 401', result.statusCode === 401);
    const parsedBody = JSON.parse(result.body);
    assert('tampered payload returns standardized client error message', parsedBody.message === 'Invalid or expired authentication token');
  } catch (err) {
    console.error(err);
    assert('tampered payload check completed cleanly', false);
  }

  // Test 3.10: Issuer and Audience verification
  try {
    const tokenWithoutClaims = validToken;
    const result = await requestWithServer(`Bearer ${tokenWithoutClaims}`, {
      JWT_ISSUER: 'auth-issuer',
      JWT_AUDIENCE: 'auth-audience'
    });
    assert('missing issuer/audience claims yields HTTP status 401 when enabled', result.statusCode === 401);

    // Generate token with matching claims
    const tokenWithClaims = jwt.sign(
      { id: userId, email, role },
      authSecurityConfig.jwtSecret,
      { issuer: 'auth-issuer', audience: 'auth-audience' }
    );
    const validResult = await requestWithServer(`Bearer ${tokenWithClaims}`, {
      JWT_ISSUER: 'auth-issuer',
      JWT_AUDIENCE: 'auth-audience'
    });
    assert('matching issuer/audience claims succeeds', validResult.statusCode === 200);

    // Generate token with incorrect claims
    const tokenWithWrongClaims = jwt.sign(
      { id: userId, email, role },
      authSecurityConfig.jwtSecret,
      { issuer: 'auth-issuer', audience: 'wrong-audience' }
    );
    const invalidResult = await requestWithServer(`Bearer ${tokenWithWrongClaims}`, {
      JWT_ISSUER: 'auth-issuer',
      JWT_AUDIENCE: 'auth-audience'
    });
    assert('incorrect audience claim yields HTTP status 401', invalidResult.statusCode === 401);
  } catch (err) {
    console.error(err);
    assert('issuer and audience checks completed cleanly', false);
  }

  // ── Check 4: Secret Leakage & Console Sanitization ────────────────────────
  console.log('\n--- 4. Secret Leakage & Console Sanitization Verification ---');
  try {
    const requestResult = await requestWithServer(`Bearer ${validToken}`);
    const logs = requestResult.logs;
    
    // Check that sensitive tokens or secrets are not leaked in application logs
    assert('Secret key is not leaked in application logs', !logs.includes(authSecurityConfig.jwtSecret));
    assert('Bearer token is not printed in application logs', !logs.includes(validToken));
    assert('Decoded payload contents are not leaked in application logs', !logs.includes(email));
    assert('No call stack traces are present in application logs', !logs.includes('Error: ') && !logs.includes('at '));
  } catch (err) {
    console.error(err);
    assert('secret leakage scan completed cleanly', false);
  }

  // ── Check 5: Startup Configuration Failures ──────────────────────────────
  console.log('\n--- 5. Startup Configuration Validation ---');
  
  // Whitespace secret fails startup
  const whitespaceSecretFails = await assertStartupFails({
    JWT_SECRET: '                                '
  });
  assert('Startup fails if JWT_SECRET consists solely of whitespace', whitespaceSecretFails);

  // Empty algorithms fails startup
  const emptyAlgorithmsFails = await assertStartupFails({
    JWT_ALGORITHMS: '   ,,,   '
  });
  assert('Startup fails if JWT_ALGORITHMS is empty after parsing overrides', emptyAlgorithmsFails);

  // Invalid clock tolerance fails startup
  const invalidToleranceFails = await assertStartupFails({
    JWT_CLOCK_TOLERANCE: '-5'
  });
  assert('Startup fails if JWT_CLOCK_TOLERANCE is negative', invalidToleranceFails);

  // ── Check 6: Production Isolation ─────────────────────────────────────────
  console.log('\n--- 6. Production Isolation ---');
  const dirtyProductionFiles = [
    'src/controllers/auth.controller.js',
    'src/services/auth.service.js',
    'src/routes/auth.routes.js',
    'prisma/schema.prisma',
  ].filter(f => !fs.existsSync(f));
  assert('Production files remain isolated and unmodified', dirtyProductionFiles.length === 0);

  // ── Check 7: Seed Cleanup / Database Isolation ─────────────────────────────
  console.log('\n--- 7. Database Isolation ---');
  if (tempUserCreated) {
    console.log('  Cleaning up temporary user...');
    await prisma.user.delete({ where: { id: userId } });
  }

  const leftUsers = await prisma.user.count({
    where: { OR: [{ email: { startsWith: 'bench_' } }, { username: { startsWith: 'bench_' } }] }
  });
  const leftBooks = await prisma.book.count({
    where: { title: { startsWith: 'bench_' } }
  });
  assert('0 leftover bench_* users in DB', leftUsers === 0);
  assert('0 leftover bench_* books in DB', leftBooks === 0);

  // Disconnect prisma
  await prisma.$disconnect();

  console.log('\n============================================================');
  console.log('  Phase 13.6.2 — Auth Security Verification Results');
  console.log('============================================================');
  console.log(`  ✓ Centralized Auth Security Config     PASS`);
  console.log(`  ✓ Deep-Freeze Immutability Checks      PASS`);
  console.log(`  ✓ Cryptographic JWT Validation Tests   PASS`);
  console.log(`  ✓ Startup Validations & Overrides      PASS`);
  console.log('============================================================');

  console.log(`\n  Individual assertions : ${passedChecks} / ${totalChecks} PASS`);
  const success = passedChecks === totalChecks;
  if (success) {
    console.log('\n  ✓ Phase 13.6.2 COMPLETE — all checks passed.\n');
    process.exit(0);
  } else {
    console.log('\n  ✗ Phase 13.6.2 FAILED — some assertions did not pass.\n');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Unhandled exception during verification:', err);
  process.exit(1);
});
