/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { test, expect } from '../../lib/fixtures/standard';

const PASSWORD = 'passwordzxcv';
let email;

test.describe('Firefox Desktop Sync v3 email first', () => {
  test.beforeEach(async ({ target, credentials, pages: { login } }) => {
    test.slow();
    email = login.createEmail('sync{id}');
    await login.clearCache();
  });

  test('open directly to /signup page, refresh on the /signup page', async ({
    target,
    page,
    pages: { login },
  }) => {
    await page.goto(
      `${target.contentServerUrl}/signup?context=fx_desktop_v3&service=sync&action=email`,
      { waitUntil: 'networkidle' }
    );
    await login.setEmail(email);
    await login.submit();

    // Verify user is redirected to the set password page
    expect(await login.signUpPasswordHeader()).toBe(true);

    //Refresh the page
    await page.reload({ waitUntil: 'load' });

    // refresh sends the user back to the first step
    expect(await login.isEmailHeader()).toBe(true);
  });

  test('open directly to /signin page, refresh on the /signin page', async ({
    target,
    page,
    pages: { login },
  }) => {
    await target.auth.signUp(email, PASSWORD, {
      lang: 'en',
      preVerified: 'true',
    });
    await page.goto(
      `${target.contentServerUrl}/signin?context=fx_desktop_v3&service=sync&action=email`,
      { waitUntil: 'networkidle' }
    );
    await login.setEmail(email);
    await login.submit();

    // Verify user is redirected to the password page
    expect(await login.isPasswordHeader()).toBe(true);

    //Refresh the page
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // refresh sends the user back to the first step
    expect(await login.isEmailHeader()).toBe(true);
  });

  test('enter a firefox.com address', async ({
    target,
    page,
    pages: { login, signinTokenCode },
  }) => {
    await page.goto(
      `${target.contentServerUrl}?context=fx_desktop_v3&service=sync&action=email`,
      { waitUntil: 'networkidle' }
    );
    await login.setEmail('testuser@firefox.com');
    await signinTokenCode.clickSubmitButton();

    // Verify the error
    expect(await login.getTooltipError()).toMatch(
      'Enter a valid email address. firefox.com does not offer email.'
    );
  });
});
