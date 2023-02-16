/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect, newPagesForSync } from '../../lib/fixtures/standard';
import { EmailHeader, EmailType } from '../../lib/email';

const password = 'passwordzxcv';
let email;

test.describe('Firefox Desktop Sync v3 sign in', () => {
  test.beforeEach(async ({ page, pages: { login } }) => {
    test.slow();
    email = login.createEmail('sync{id}');
  });

  test('verified, does not need to confirm', async ({ target }) => {
    const { page, login, connectAnotherDevice, signinTokenCode } =
      await newPagesForSync(target);
    const uaStrings = {
      desktop_firefox_58:
        'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:58.0) Gecko/20100101 Firefox/58.0',
    };
    const query = { forceUA: uaStrings['desktop_firefox_58'] };
    const queryParam = new URLSearchParams(query);
    const email = login.createEmail();
    await target.auth.signUp(email, password, {
      lang: 'en',
      preVerified: 'true',
    });
    await page.goto(
      `${
        target.contentServerUrl
      }?context=fx_desktop_v3&service=sync&action=email&${queryParam.toString()}`
    );
    await login.setEmail(email);
    await signinTokenCode.clickSubmitButton();
    await login.setPassword(password);
    await login.submit();
    expect(await connectAnotherDevice.fxaConnected.isVisible()).toBeTruthy();
  });

  test('verified, resend', async ({ target }) => {
    const { page, login, connectAnotherDevice, signinTokenCode } =
      await newPagesForSync(target);
    await page.goto(
      `${target.contentServerUrl}?context=fx_desktop_v3&service=sync&action=email`
    );
    await login.setEmail(email);
    await signinTokenCode.clickSubmitButton();
    await login.setPassword(password);
    await login.confirmPassword(password);
    await login.setAge('21');
    await login.submit();

    // Click resend link
    await signinTokenCode.resendLink.click();
    await signinTokenCode.successMessage.waitFor({ state: 'visible' });
    await expect(signinTokenCode.successMessage).toBeVisible();
    await expect(signinTokenCode.successMessage).toContainText('Email resent.');
    const code = await target.email.waitForEmail(
      email,
      EmailType.verifyShortCode,
      EmailHeader.shortCode
    );
    await signinTokenCode.input.fill(code);
    await login.submit();
    expect(await connectAnotherDevice.fxaConnected.isVisible()).toBeTruthy();
  });

  test('verified - invalid code', async ({ target }) => {
    const { page, login, connectAnotherDevice, signinTokenCode } =
      await newPagesForSync(target);
    const uaStrings = {
      desktop_firefox_58:
        'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:58.0) Gecko/20100101 Firefox/58.0',
    };
    const query = { forceUA: uaStrings['desktop_firefox_58'] };
    const queryParam = new URLSearchParams(query);
    await page.goto(
      `${
        target.contentServerUrl
      }?context=fx_desktop_v3&service=sync&action=email&${queryParam.toString()}`
    );
    await login.setEmail(email);
    await signinTokenCode.clickSubmitButton();
    await login.setPassword(password);
    await login.confirmPassword(password);
    await login.setAge('21');
    await login.submit();

    // Input invalid code and verify the tooltip error
    await signinTokenCode.input.fill('000000');
    await signinTokenCode.submit.click();
    await expect(signinTokenCode.tooltip).toContainText('Invalid or expired');

    //Input Valid code and verify the success
    await login.fillOutSignUpCode(email);
    expect(await connectAnotherDevice.fxaConnected.isVisible()).toBeTruthy();
  });

  test('verified, blocked', async ({ target }) => {
    const { page, login, connectAnotherDevice, signinTokenCode } =
      await newPagesForSync(target);
    const uaStrings = {
      desktop_firefox_58:
        'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:58.0) Gecko/20100101 Firefox/58.0',
    };
    const query = { forceUA: uaStrings['desktop_firefox_58'] };
    const queryParam = new URLSearchParams(query);
    const blockedEmail = login.createEmail('blocked{id}');
    await target.auth.signUp(blockedEmail, password, {
      lang: 'en',
      preVerified: 'true',
    });
    await page.goto(
      `${
        target.contentServerUrl
      }?context=fx_desktop_v3&service=sync&${queryParam.toString()}`
    );
    await login.setEmail(blockedEmail);
    await signinTokenCode.clickSubmitButton();
    await login.setPassword(password);
    await login.submit();
    await login.unblock(blockedEmail);
    expect(await connectAnotherDevice.fxaConnected.isVisible()).toBeTruthy();
  });

  test('unverified', async ({ target }) => {
    const { page, login, connectAnotherDevice, signinTokenCode } =
      await newPagesForSync(target);
    const uaStrings = {
      desktop_firefox_58:
        'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:58.0) Gecko/20100101 Firefox/58.0',
    };
    const query = { forceUA: uaStrings['desktop_firefox_58'] };
    const queryParam = new URLSearchParams(query);
    await target.auth.signUp(email, password, {
      lang: 'en',
      preVerified: 'false',
    });
    await page.goto(
      `${
        target.contentServerUrl
      }?context=fx_desktop_v3&service=sync&action=email&${queryParam.toString()}`
    );
    await login.setEmail(email);
    await signinTokenCode.clickSubmitButton();
    await login.setPassword(password);
    await login.submit();
    await login.fillOutSignInCode(email);
    expect(await connectAnotherDevice.fxaConnected.isVisible()).toBeTruthy();
  });
});
