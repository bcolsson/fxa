import { test, expect } from '../../lib/fixtures/standard';

test.describe('subscription test with cc and paypal', () => {
  test.beforeEach(() => {
    test.slow();
  });

  test('subscribe with credit card and login to product', async ({
    pages: { relier, login, subscribe },
  }) => {
    await relier.goto();
    await relier.clickSubscribe();
    await subscribe.setFullName();
    await subscribe.setCreditCardInfo();
    await subscribe.clickPayNow();
    await subscribe.submit();
    await relier.goto();
    await relier.clickEmailFirst();
    await login.submit();
    expect(await relier.isPro()).toBe(true);
  });

  test('subscribe with credit card after initial failed subscription', async ({
    pages: { relier, login, subscribe },
  }) => {
    await relier.goto();
    await relier.clickSubscribe();
    await subscribe.setFullName();
    await subscribe.setFailedCreditCardInfo();
    await subscribe.clickPayNow();
    await subscribe.clickTryAgain();
    await subscribe.setCreditCardInfo();
    await subscribe.clickPayNow();
    await subscribe.submit();
    await relier.goto();
    await relier.clickEmailFirst();
    await login.submit();
    expect(await relier.isPro()).toBe(true);
  });

  //Diabling the test as this is being flaky because Paypal Sandbox is being finicky
  // FXA - 6786, FXA - 6788
  /*test('subscribe with paypal and login to product', async ({
    pages: { relier, login, subscribe },
  }) => {
    await relier.goto();
    await relier.clickSubscribe();
    await subscribe.setPayPalInfo();
    await subscribe.submit();
    await relier.goto();
    await relier.clickEmailFirst();
    await login.submit();
    expect(await relier.isPro()).toBe(true);
  });*/
});
