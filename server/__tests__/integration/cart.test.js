// Set env vars before any require so keys.js reads the test values
process.env.JWT_SECRET = 'test-secret';
process.env.BASE_API_URL = 'api';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { connect, disconnect } = require('../../utils/integrationSetup');

let app;
let User;
let Product;
let Cart;

describe('POST /api/cart/add — integration tests (Bug #7: missing quantity validation)', () => {
  let buyerToken;
  let productId;

  beforeAll(async () => {
    await connect();

    app = require('../../app');
    User = mongoose.model('User');
    Product = mongoose.model('Product');
    Cart = mongoose.model('Cart');

    const buyer = await User.create({
      email: 'buyer@test.com',
      firstName: 'Test',
      lastName: 'Buyer',
      provider: 'email'
    });

    buyerToken = jwt.sign({ id: buyer._id }, process.env.JWT_SECRET);
  }, 30000);

  beforeEach(async () => {
    // Fresh product for each test so stock is always 10
    await Product.deleteMany({});
    await Cart.deleteMany({});
    const product = await Product.create({
      name: 'Test Widget',
      price: 100,
      quantity: 10,
      isActive: true,
      taxable: true
    });
    productId = product._id;
  });

  afterAll(async () => {
    await disconnect();
  });

  // ── Green tests (valid inputs — pass today and after the fix) ──

  it('TC-CART-02: accepts quantity = 1 (lower valid boundary)', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        products: [{ product: productId, quantity: 1, price: 100, taxable: true }]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('TC-CART-03: accepts quantity = 10 (upper valid boundary — at stock level)', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        products: [{ product: productId, quantity: 10, price: 100, taxable: true }]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 when called without a token (auth guard works)', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .send({
        products: [{ product: productId, quantity: 1, price: 100, taxable: true }]
      });

    expect(res.status).toBe(401);
  });

  // ── Red tests (Bug #7 — FAIL today, will pass after the fix) ──

  it('TC-CART-01: rejects quantity = 0 (lower boundary of invalid partition) [RED — Bug #7]', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        products: [{ product: productId, quantity: 0, price: 100, taxable: true }]
      });

    // Bug #7: no validation exists — currently returns 200 with a zero-qty cart line.
    expect(res.status).toBe(400);
  });

  it('TC-CART-04: rejects quantity > stock (11 when stock = 10) [RED — Bug #7]', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        products: [{ product: productId, quantity: 11, price: 100, taxable: true }]
      });

    // Bug #7: no stock comparison — currently returns 200 and oversells past zero.
    expect(res.status).toBe(400);
  });

  it('TC-CART-05: rejects negative quantity (-5) [RED — Bug #7, live-verified]', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        products: [{ product: productId, quantity: -5, price: 100, taxable: true }]
      });

    // Bug #7: sign-flip in decreaseQuantity ($inc: { quantity: -(-5) } = +5)
    // inflates stock from 10 to 15; persists totalPrice: -500 in the cart.
    // Live-verified — see ProjectPlan/TODO.md Bug #7.
    expect(res.status).toBe(400);
  });
});
