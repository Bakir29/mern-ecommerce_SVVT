const { caculateItemsSalesTax, caculateOrderTotal } = require('../store');

// stateTaxRate is 0.05 in server/config/tax.js — fixed here so the expected
// numbers in this file stay meaningful even if the config value changes later.
jest.mock('../../config/tax', () => ({ stateTaxRate: 0.05 }));

describe('caculateItemsSalesTax', () => {
  it('computes totalPrice, tax and priceWithTax for a taxable item', () => {
    const items = [{ price: 100, quantity: 2, taxable: true }];

    const [result] = caculateItemsSalesTax(items);

    expect(result.purchasePrice).toBe(100);
    expect(result.totalPrice).toBe(200);
    expect(result.totalTax).toBe(10);
    expect(result.priceWithTax).toBe(210);
  });

  it('leaves tax fields at zero for a non-taxable item', () => {
    const items = [{ price: 100, quantity: 2, taxable: false }];

    const [result] = caculateItemsSalesTax(items);

    expect(result.totalPrice).toBe(200);
    expect(result.totalTax).toBe(0);
    expect(result.priceWithTax).toBe(0);
  });

  it('handles multiple line items independently', () => {
    const items = [
      { price: 50, quantity: 1, taxable: true },
      { price: 20, quantity: 3, taxable: false }
    ];

    const [first, second] = caculateItemsSalesTax(items);

    expect(first.totalPrice).toBe(50);
    expect(first.priceWithTax).toBe(52.5);
    expect(second.totalPrice).toBe(60);
    expect(second.priceWithTax).toBe(0);
  });

  // Characterization test — documents the unit-level root cause behind Bug #7
  // (see ProjectPlan/TODO.md). caculateItemsSalesTax performs no sign/range
  // validation on quantity or price: it happily produces negative totals from
  // negative input. The function is not where the fix belongs (it's a pure
  // calculator); this test exists to pin down — and make visible — exactly
  // how far downstream the unvalidated value travels before causing damage,
  // so the eventual validation fix at the route layer (cart.js /add) has a
  // documented contract to validate against.
  it('documents that negative quantity propagates into negative totals (Bug #7 root cause)', () => {
    const items = [{ price: 100, quantity: -5, taxable: true }];

    const [result] = caculateItemsSalesTax(items);

    expect(result.totalPrice).toBe(-500);
    expect(result.totalTax).toBe(-25);
    expect(result.priceWithTax).toBe(-525);
  });
});

describe('caculateOrderTotal', () => {
  it('sums totalPrice across all non-cancelled products', () => {
    const order = {
      products: [
        { status: 'Not processed', totalPrice: 100 },
        { status: 'Delivered', totalPrice: 50 },
        { status: 'Cancelled', totalPrice: 9999 }
      ]
    };

    expect(caculateOrderTotal(order)).toBe(150);
  });

  it('returns 0 for an order with no products or only cancelled products', () => {
    expect(caculateOrderTotal({ products: [] })).toBe(0);
    expect(
      caculateOrderTotal({ products: [{ status: 'Cancelled', totalPrice: 100 }] })
    ).toBe(0);
  });
});
