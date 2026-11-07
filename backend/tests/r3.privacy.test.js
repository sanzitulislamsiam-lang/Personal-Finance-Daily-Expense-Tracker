/**
 * R3 - Data Privacy & Security tests
 *  - balance masking preference
 *  - PIN create / change / remove / verify (hashed, validated, brute-force lock-out)
 *  - PIN-based section lock enforced on the server (accounts routes)
 *
 * Needs a local MongoDB. Uses a separate DB (finance_tracker_test) and drops it afterwards.
 * Run:  npm test
 */
process.env.JWT_SECRET = 'test_secret';
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

const TEST_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/finance_tracker_test';

const auth = (token) => ({ Authorization: `Bearer ${token}` });
let counter = 0;
let notAtomicDb = false; // FerretDB (SQLite) does not make concurrent $inc atomic; real MongoDB does

// helper: register a brand-new user and return { token, id }
const newUser = async () => {
  counter += 1;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: `User ${counter}`, email: `user${counter}@test.com`, password: 'secret123' });
  expect(res.status).toBe(201);
  return { token: res.body.token, id: res.body._id, body: res.body };
};

// helper: new user who already has PIN 1234
const userWithPin = async (pin = '1234') => {
  const u = await newUser();
  const res = await request(app).post('/api/users/pin').set(auth(u.token)).send({ pin });
  expect(res.status).toBe(200);
  return u;
};

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
  await mongoose.connection.dropDatabase();
  const info = await mongoose.connection.db.admin().command({ buildInfo: 1 });
  notAtomicDb = Boolean(info.ferretdbVersion);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('R3 - balance masking', () => {
  test('new users start with masking off, no PIN and no locked sections', async () => {
    const u = await newUser();
    expect(u.body.privacySettings).toEqual({
      maskBalances: false,
      pinEnabled: false,
      lockedSections: [],
    });
  });

  test('maskBalances can be turned on and is persisted', async () => {
    const u = await newUser();
    const put = await request(app)
      .put('/api/users/privacy')
      .set(auth(u.token))
      .send({ maskBalances: true });
    expect(put.status).toBe(200);
    expect(put.body.privacySettings.maskBalances).toBe(true);

    const get = await request(app).get('/api/users/profile').set(auth(u.token));
    expect(get.body.privacySettings.maskBalances).toBe(true);
  });

  test('maskBalances must be a boolean', async () => {
    const u = await newUser();
    const res = await request(app)
      .put('/api/users/privacy')
      .set(auth(u.token))
      .send({ maskBalances: 'yes' });
    expect(res.status).toBe(400);
  });

  test('empty privacy update is rejected', async () => {
    const u = await newUser();
    const res = await request(app).put('/api/users/privacy').set(auth(u.token)).send({});
    expect(res.status).toBe(400);
  });

  test('requires login', async () => {
    const res = await request(app).put('/api/users/privacy').send({ maskBalances: true });
    expect(res.status).toBe(401);
  });
});

describe('R1 regression - profile update still works', () => {
  test('name and currency can be updated', async () => {
    const u = await newUser();
    const res = await request(app)
      .put('/api/users/profile')
      .set(auth(u.token))
      .send({ name: 'New Name', preferredCurrency: 'USD' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect(res.body.preferredCurrency).toBe('USD');
  });
});

describe('R3 - create / change / remove PIN', () => {
  test.each(['123', '12345', 'abcd', '12a4', '1e10', ' 123', ''])(
    'rejects invalid PIN "%s"',
    async (bad) => {
      const u = await newUser();
      const res = await request(app).post('/api/users/pin').set(auth(u.token)).send({ pin: bad });
      expect(res.status).toBe(400);
    }
  );

  test('creates a PIN, stores only a bcrypt hash and never returns it', async () => {
    const u = await newUser();
    const res = await request(app).post('/api/users/pin').set(auth(u.token)).send({ pin: '4821' });
    expect(res.status).toBe(200);
    expect(res.body.privacySettings.pinEnabled).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain('4821');
    expect(JSON.stringify(res.body)).not.toContain('securityPin');

    const dbUser = await User.findById(u.id).select('+privacySettings.securityPin');
    expect(dbUser.privacySettings.securityPin).not.toBe('4821');
    expect(await bcrypt.compare('4821', dbUser.privacySettings.securityPin)).toBe(true);
  });

  test('profile / login responses never expose the PIN hash or counters', async () => {
    const u = await userWithPin();
    const profile = await request(app).get('/api/users/profile').set(auth(u.token));
    expect(Object.keys(profile.body.privacySettings).sort()).toEqual(
      ['lockedSections', 'maskBalances', 'pinEnabled']
    );
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: `user${counter}@test.com`, password: 'secret123' });
    expect(Object.keys(login.body.privacySettings).sort()).toEqual(
      ['lockedSections', 'maskBalances', 'pinEnabled']
    );
  });

  test('changing an existing PIN needs the current PIN', async () => {
    const u = await userWithPin('1234');

    const noCurrent = await request(app).post('/api/users/pin').set(auth(u.token)).send({ pin: '9999' });
    expect(noCurrent.status).toBe(401);

    const wrong = await request(app)
      .post('/api/users/pin')
      .set(auth(u.token))
      .send({ pin: '9999', currentPin: '0000' });
    expect(wrong.status).toBe(401);

    const ok = await request(app)
      .post('/api/users/pin')
      .set(auth(u.token))
      .send({ pin: '9999', currentPin: '1234' });
    expect(ok.status).toBe(200);

    // old PIN no longer works, new one does
    const oldPin = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '1234' });
    expect(oldPin.status).toBe(401);
    const newPin = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '9999' });
    expect(newPin.status).toBe(200);
  });

  test('removing the PIN needs the correct PIN and clears all locks', async () => {
    const u = await userWithPin('1234');
    await request(app)
      .put('/api/users/privacy')
      .set(auth(u.token))
      .send({ lockedSections: ['accounts'], pin: '1234' });

    const wrong = await request(app).delete('/api/users/pin').set(auth(u.token)).send({ pin: '0000' });
    expect(wrong.status).toBe(401);

    const ok = await request(app).delete('/api/users/pin').set(auth(u.token)).send({ pin: '1234' });
    expect(ok.status).toBe(200);
    expect(ok.body.privacySettings).toEqual({
      maskBalances: false,
      pinEnabled: false,
      lockedSections: [],
    });

    // accounts open again without any token
    const accounts = await request(app).get('/api/accounts').set(auth(u.token));
    expect(accounts.status).toBe(200);
  });

  test('removing a PIN that does not exist is a 400', async () => {
    const u = await newUser();
    const res = await request(app).delete('/api/users/pin').set(auth(u.token)).send({ pin: '1234' });
    expect(res.status).toBe(400);
  });

  test('profile update can NOT be used to bypass the PIN', async () => {
    const u = await userWithPin('1234');
    const res = await request(app)
      .put('/api/users/profile')
      .set(auth(u.token))
      .send({ name: 'Hacker', privacySettings: { pinEnabled: false, securityPin: '0000', lockedSections: [] } });
    expect(res.status).toBe(200);
    expect(res.body.privacySettings.pinEnabled).toBe(true);

    const verify = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '1234' });
    expect(verify.status).toBe(200); // original PIN still valid
  });
});

describe('R3 - verify PIN', () => {
  test('correct PIN returns an unlock token', async () => {
    const u = await userWithPin('1234');
    const res = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(typeof res.body.unlockToken).toBe('string');
    expect(res.body.expiresIn).toBe(600);
  });

  test('wrong PIN is 401 and reports attempts remaining', async () => {
    const u = await userWithPin('1234');
    const res = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '1111' });
    expect(res.status).toBe(401);
    expect(res.body.valid).toBe(false);
    expect(res.body.attemptsRemaining).toBe(4);
    expect(res.body.unlockToken).toBeUndefined();
  });

  test('missing PIN is 400; PIN not enabled is 400', async () => {
    const withPin = await userWithPin();
    const missing = await request(app).post('/api/users/verify-pin').set(auth(withPin.token)).send({});
    expect(missing.status).toBe(400);

    const noPin = await newUser();
    const res = await request(app).post('/api/users/verify-pin').set(auth(noPin.token)).send({ pin: '1234' });
    expect(res.status).toBe(400);
  });

  test('5 wrong PINs lock the user out, even the correct PIN is refused (423)', async () => {
    const u = await userWithPin('1234');
    for (let i = 1; i <= 4; i++) {
      const r = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '0000' });
      expect(r.status).toBe(401);
      expect(r.body.attemptsRemaining).toBe(5 - i);
    }
    const fifth = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '0000' });
    expect(fifth.status).toBe(423);
    expect(fifth.body.code).toBe('PIN_LOCKED_OUT');
    expect(fifth.body.retryAfterSeconds).toBeGreaterThan(0);

    const correct = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '1234' });
    expect(correct.status).toBe(423);
    expect(correct.body.unlockToken).toBeUndefined();
  });

  test('a correct PIN resets the failed-attempt counter', async () => {
    const u = await userWithPin('1234');
    await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '0000' });
    await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '0000' });
    const ok = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '1234' });
    expect(ok.status).toBe(200);
    const again = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '0000' });
    expect(again.body.attemptsRemaining).toBe(4);
  });

  test('parallel guessing cannot exceed the attempt limit', async () => {
    if (notAtomicDb) {
      console.warn('Skipped: this database is not MongoDB (no atomic concurrent $inc).');
      return;
    }
    const u = await userWithPin('1234');
    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '0000' })
      )
    );
    // every guess is refused, and at most 5 of them were actually compared (401)
    expect(results.every((r) => r.status === 401 || r.status === 423)).toBe(true);
    expect(results.filter((r) => r.status === 401).length).toBeLessThanOrEqual(5);
    const stillLocked = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '1234' });
    expect(stillLocked.status).toBe(423);
  });

  test('lock-out ends after the lock time has passed', async () => {
    const u = await userWithPin('1234');
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '0000' });
    }
    // simulate 6 minutes passing
    await User.updateOne({ _id: u.id }, { 'privacySettings.pinLockedUntil': new Date(Date.now() - 1000) });
    const ok = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '1234' });
    expect(ok.status).toBe(200);
  });
});

describe('R3 - PIN-based section locks', () => {
  test('cannot lock a section before a PIN exists', async () => {
    const u = await newUser();
    const res = await request(app)
      .put('/api/users/privacy')
      .set(auth(u.token))
      .send({ lockedSections: ['accounts'] });
    expect(res.status).toBe(400);
  });

  test('unknown section names are rejected', async () => {
    const u = await userWithPin();
    const res = await request(app)
      .put('/api/users/privacy')
      .set(auth(u.token))
      .send({ lockedSections: ['nonsense'], pin: '1234' });
    expect(res.status).toBe(400);
  });

  test('changing locked sections requires the PIN', async () => {
    const u = await userWithPin('1234');
    const noPin = await request(app)
      .put('/api/users/privacy')
      .set(auth(u.token))
      .send({ lockedSections: ['accounts'] });
    expect(noPin.status).toBe(401);

    const ok = await request(app)
      .put('/api/users/privacy')
      .set(auth(u.token))
      .send({ lockedSections: ['accounts', 'accounts', 'budgets'], pin: '1234' });
    expect(ok.status).toBe(200);
    expect(ok.body.privacySettings.lockedSections).toEqual(['accounts', 'budgets']); // de-duplicated
  });

  test('unlocked section behaves normally (no token needed)', async () => {
    const u = await userWithPin();
    const res = await request(app).get('/api/accounts').set(auth(u.token));
    expect(res.status).toBe(200);
  });

  describe('locked "accounts" section', () => {
    let u;
    let unlockToken;

    beforeAll(async () => {
      u = await userWithPin('1234');
      await request(app)
        .put('/api/users/privacy')
        .set(auth(u.token))
        .send({ lockedSections: ['accounts'], pin: '1234' });
      const v = await request(app).post('/api/users/verify-pin').set(auth(u.token)).send({ pin: '1234' });
      unlockToken = v.body.unlockToken;
    });

    test('blocked (423 PIN_REQUIRED) without an unlock token - GET and POST', async () => {
      const get = await request(app).get('/api/accounts').set(auth(u.token));
      expect(get.status).toBe(423);
      expect(get.body.code).toBe('PIN_REQUIRED');
      expect(get.body.section).toBe('accounts');

      const post = await request(app)
        .post('/api/accounts')
        .set(auth(u.token))
        .send({ name: 'Sneaky', accountType: 'Cash' });
      expect(post.status).toBe(423);
    });

    test('blocked with a garbage token', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set({ ...auth(u.token), 'x-pin-token': 'not-a-real-token' });
      expect(res.status).toBe(423);
    });

    test('blocked when the login token is reused as unlock token', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set({ ...auth(u.token), 'x-pin-token': u.token });
      expect(res.status).toBe(423);
    });

    test("blocked with another user's unlock token", async () => {
      const other = await userWithPin('1234');
      const v = await request(app).post('/api/users/verify-pin').set(auth(other.token)).send({ pin: '1234' });
      const res = await request(app)
        .get('/api/accounts')
        .set({ ...auth(u.token), 'x-pin-token': v.body.unlockToken });
      expect(res.status).toBe(423);
    });

    test('blocked with an expired unlock token', async () => {
      const jwt = require('jsonwebtoken');
      const expired = jwt.sign({ id: u.id, purpose: 'pin-unlock' }, 'test_secret', { expiresIn: -10 });
      const res = await request(app)
        .get('/api/accounts')
        .set({ ...auth(u.token), 'x-pin-token': expired });
      expect(res.status).toBe(423);
    });

    test('allowed with the valid unlock token, and CRUD works', async () => {
      const headers = { ...auth(u.token), 'x-pin-token': unlockToken };
      const list = await request(app).get('/api/accounts').set(headers);
      expect(list.status).toBe(200);

      const created = await request(app)
        .post('/api/accounts')
        .set(headers)
        .send({ name: 'Wallet', accountType: 'Cash', balance: 500 });
      expect(created.status).toBe(201);
    });

    test('other (unlocked) endpoints such as profile still work without a token', async () => {
      const res = await request(app).get('/api/users/profile').set(auth(u.token));
      expect(res.status).toBe(200);
    });
  });
});
