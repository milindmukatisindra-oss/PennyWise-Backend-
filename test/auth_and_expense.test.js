import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, comparePassword } from '../src/utils/password.js';
import { generateToken, verifyToken } from '../src/utils/token.js';
import { calculatePercentage, roundToTwoDecimals } from '../src/utils/money.js';
import UserModel from '../src/models/UserModel.js';
import ExpenseModel from '../src/models/ExpenseModel.js';
import IncomeModel from '../src/models/IncomeModel.js';
import BudgetModel from '../src/models/BudgetModel.js';

test('Security: bcrypt password hashing and verification', async () => {
  const plain = 'superSecret123!';
  const hash = await hashPassword(plain);

  assert.notEqual(plain, hash, 'Hash must never equal plaintext');
  assert.ok(hash.startsWith('$2'), 'Hash must follow standard bcrypt format');

  const matches = await comparePassword(plain, hash);
  assert.equal(matches, true, 'Valid password must match hash');

  const falseMatches = await comparePassword('wrongPassword', hash);
  assert.equal(falseMatches, false, 'Invalid password must be rejected');
});

test('Security: JWT token generation and verification', () => {
  const payload = { id: 'user-123', email: 'teen@school.edu', name: 'Alex' };
  const token = generateToken(payload);

  assert.ok(typeof token === 'string' && token.length > 20, 'JWT token must be a non-empty string');

  const decoded = verifyToken(token);
  assert.equal(decoded.id, payload.id);
  assert.equal(decoded.email, payload.email);
});

test('Financial Calculations: Safe rounding and category percentages', () => {
  assert.equal(roundToTwoDecimals(19.999), 20);
  assert.equal(roundToTwoDecimals(0.1 + 0.2), 0.3);

  const pct = calculatePercentage(350, 1000);
  assert.equal(pct, 35);

  const zeroTotal = calculatePercentage(100, 0);
  assert.equal(zeroTotal, 0);
});

test('Data Isolation: User cannot view another user\'s expenses', async () => {
  const userA = 'user-aaa-111';
  const userB = 'user-bbb-222';

  const expA = await ExpenseModel.create({
    userId: userA,
    categoryId: 'cat-1',
    amount: 150,
    description: 'Book for User A',
    expenseDate: '2026-09-28',
    paymentMethod: 'UPI',
  });

  // User B tries to fetch User A's expense by ID
  const forbiddenAttempt = await ExpenseModel.findById(expA.id, userB);
  assert.equal(forbiddenAttempt, null, 'User B must not be able to fetch User A\'s expense');

  // User A can fetch it
  const allowedAttempt = await ExpenseModel.findById(expA.id, userA);
  assert.ok(allowedAttempt !== null);
  assert.equal(allowedAttempt.id, expA.id);
});
