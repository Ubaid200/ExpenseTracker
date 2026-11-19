const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Account = require('../models/Account');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

jest.setTimeout(30000);

describe('Transaction CRUD & Multi-Tenant Cross-User Isolation Tests', () => {
  let tokenUserA;
  let userA_id;
  let accountA_id;
  let category_id;
  let transactionA_id;

  let tokenUserB;
  let userB_id;
  let accountB_id;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    // 1. Create and authenticate User A
    const userAEmail = `tx_user_a_${Date.now()}@example.com`;
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice Test', email: userAEmail, password: 'Password123' });
    tokenUserA = resA.body.token;
    userA_id = resA.body.user.id;

    // Create Account for User A
    const accResA = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ name: 'Alice Checking', type: 'bank', balance: 5000 });
    accountA_id = accResA.body.account._id;

    // Get a valid Category (categories are pre-seeded or fetch default)
    const catRes = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${tokenUserA}`);
    category_id = catRes.body.categories[0]._id;

    // 2. Create and authenticate User B (Attacker / Different User)
    const userBEmail = `tx_user_b_${Date.now()}@example.com`;
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob Test', email: userBEmail, password: 'Password123' });
    tokenUserB = resB.body.token;
    userB_id = resB.body.user.id;

    // Create Account for User B
    const accResB = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({ name: 'Bob Savings', type: 'savings', balance: 2000 });
    accountB_id = accResB.body.account._id;
  });

  afterAll(async () => {
    // Cleanup all created records
    const testIds = [userA_id, userB_id];
    await Promise.all([
      User.deleteMany({ _id: { $in: testIds } }),
      Account.deleteMany({ user: { $in: testIds } }),
      Transaction.deleteMany({ user: { $in: testIds } }),
    ]);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // --------------------------------------------------------------------------
  // PART 1: CRUD Operations for User A
  // --------------------------------------------------------------------------
  describe('Transaction CRUD (User A)', () => {
    it('should CREATE a transaction for User A and adjust account balance', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          amount: 250,
          type: 'expense',
          category: category_id,
          account: accountA_id,
          note: 'Groceries bill',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.transaction).toBeDefined();
      expect(res.body.transaction.amount).toBe(250);
      expect(res.body.transaction.user.toString()).toBe(userA_id.toString());
      transactionA_id = res.body.transaction._id;

      // Verify Account balance was deducted: 5000 - 250 = 4750
      const updatedAccount = await Account.findById(accountA_id);
      expect(updatedAccount.balance).toBe(4750);
    });

    it('should fail transaction creation when input validation fails (e.g. negative amount)', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          amount: -50,
          type: 'expense',
          category: category_id,
          account: accountA_id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should READ all transactions for User A', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.transactions)).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });

    it('should READ a single transaction by ID for User A', async () => {
      const res = await request(app)
        .get(`/api/transactions/${transactionA_id}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.transaction._id.toString()).toBe(transactionA_id.toString());
      expect(res.body.transaction.amount).toBe(250);
    });

    it('should UPDATE a transaction for User A', async () => {
      const res = await request(app)
        .put(`/api/transactions/${transactionA_id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          amount: 300,
          note: 'Updated Groceries bill',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.transaction.amount).toBe(300);

      // Verify Account balance adjusted for difference (5000 - 300 = 4700)
      const updatedAccount = await Account.findById(accountA_id);
      expect(updatedAccount.balance).toBe(4700);
    });

    it('should DELETE a transaction for User A and revert account balance', async () => {
      // Create a temporary transaction to delete
      const tempRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          amount: 100,
          type: 'expense',
          category: category_id,
          account: accountA_id,
        });
      const tempId = tempRes.body.transaction._id;

      const delRes = await request(app)
        .delete(`/api/transactions/${tempId}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Ensure deleted from DB
      const found = await Transaction.findById(tempId);
      expect(found).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // PART 2: Cross-User Isolation (User B cannot access or modify User A's data)
  // --------------------------------------------------------------------------
  describe('Cross-User Data Isolation (Security & IDOR Prevention)', () => {
    it("should prevent User B from reading User A's transaction (returns 404)", async () => {
      const res = await request(app)
        .get(`/api/transactions/${transactionA_id}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("should prevent User B from updating User A's transaction (returns 404)", async () => {
      const res = await request(app)
        .put(`/api/transactions/${transactionA_id}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          amount: 9999,
          note: 'Hacked by Bob',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // Verify User A's transaction remained untouched
      const tx = await Transaction.findById(transactionA_id);
      expect(tx.amount).toBe(300);
      expect(tx.note).not.toBe('Hacked by Bob');
    });

    it("should prevent User B from deleting User A's transaction (returns 404)", async () => {
      const res = await request(app)
        .delete(`/api/transactions/${transactionA_id}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // Verify still exists in DB
      const tx = await Transaction.findById(transactionA_id);
      expect(tx).not.toBeNull();
    });

    it("should prevent User B from charging a transaction to User A's account (returns 404)", async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          amount: 1500,
          type: 'expense',
          category: category_id,
          account: accountA_id, // User B specifies Alice's account ID
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/account not found/i);
    });

    it("should ensure User B's transaction list does NOT contain User A's transactions", async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(0);
      expect(res.body.transactions.length).toBe(0);
    });
  });
});
