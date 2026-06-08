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
let Order;

describe('DELETE /api/order/cancel/:orderId — integration tests (Bug #5: IDOR)', () => {
  let userAToken;
  let userBToken;
  let userAId;
  let orderId;

  beforeAll(async () => {
    await connect();

    app = require('../../app');
    User = mongoose.model('User');
    Product = mongoose.model('Product');
    Cart = mongoose.model('Cart');
    Order = mongoose.model('Order');
  }, 30000);

  beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});

    const userA = await User.create({
      email: 'buyer-a@test.com',
      firstName: 'Buyer',
      lastName: 'A',
      provider: 'email'
    });

    const userB = await User.create({
      email: 'buyer-b@test.com',
      firstName: 'Buyer',
      lastName: 'B',
      provider: 'email'
    });

    userAId = userA._id;
    userAToken = jwt.sign({ id: userA._id }, process.env.JWT_SECRET);
    userBToken = jwt.sign({ id: userB._id }, process.env.JWT_SECRET);

    // Create a product so increaseQuantity has a real operation to run
    const product = await Product.create({
      name: 'Test Widget',
      price: 100,
      quantity: 10,
      isActive: true,
      taxable: true
    });

    // Cart with one product so the cancel route's increaseQuantity doesn't
    // receive an empty bulkWrite (MongoDB rejects bulkWrite([]))
    const cart = await Cart.create({
      user: userAId,
      products: [{
        product: product._id,
        purchasePrice: 100,
        totalPrice: 100,
        totalTax: 5,
        priceWithTax: 105,
        quantity: 1
      }]
    });

    const order = await Order.create({
      user: userAId,
      cart: cart._id,
      total: 105
    });

    orderId = order._id;
  });

  afterAll(async () => {
    await disconnect();
  });

  // ── Green test (valid case — passes today) ──

  it('TC-ORD-01: owner (User A) cancels their own order — returns 200', async () => {
    const res = await request(app)
      .delete(`/api/order/cancel/${orderId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const gone = await Order.findById(orderId);
    expect(gone).toBeNull();
  });

  // ── Red test (Bug #5 — FAILS today, will pass after the fix) ──

  it("TC-ORD-04: non-owner (User B) cancels User A's order — must be rejected [RED — Bug #5 IDOR]", async () => {
    const res = await request(app)
      .delete(`/api/order/cancel/${orderId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    // Bug #5: route does Order.findOne({ _id: orderId }) with no ownership
    // check against req.user._id — any authenticated user can cancel any order.
    // Correct response: 403 Forbidden (or 404 to avoid confirming existence).
    expect(res.status).toBeGreaterThanOrEqual(403);

    // The order must NOT have been deleted
    const stillThere = await Order.findById(orderId);
    expect(stillThere).not.toBeNull();
  });

  it('returns 401 when called without a token', async () => {
    const res = await request(app)
      .delete(`/api/order/cancel/${orderId}`);

    expect(res.status).toBe(401);
  });
});
