/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { screen, within } from '@testing-library/react';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider';
import PasswordStrengthBalloon from '.';
// import { getFtlBundle, testAllL10n } from 'fxa-react/lib/test-utils';
// import { FluentBundle } from '@fluent/bundle';

describe('PasswordStrengthBalloon component', () => {
  // TODO: enable l10n tests when FXA-6461 is resolved (handle embedded tags)
  // let bundle: FluentBundle;
  // beforeAll(async () => {
  //   bundle = await getFtlBundle('settings');
  // });

  it('renders password requirements as expected', () => {
    renderWithLocalizationProvider(
      <PasswordStrengthBalloon
        hasUserTakenAction={false}
        isTooShort={true}
        isSameAsEmail={false}
        isCommon={false}
      />
    );
    // testAllL10n(screen, bundle);

    screen.getByRole('heading', { name: 'Password requirements' });
    screen.getByText('At least 8 characters');
    screen.getByText('Not your email address');
    screen.getByText('Not a commonly used password');
    screen.getByTestId('password-tip');
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://support.mozilla.org/kb/password-strength'
    );
  });
  it('displays checkmark icon when password requirements are respected', () => {
    renderWithLocalizationProvider(
      <PasswordStrengthBalloon
        hasUserTakenAction={true}
        isTooShort={false}
        isSameAsEmail={false}
        isCommon={false}
      />
    );

    const passwordMinCharRequirement = screen.getByTestId(
      'password-min-char-req'
    );
    const passwordNotEmailRequirement = screen.getByTestId(
      'password-not-email-req'
    );
    const passwordNotCommonRequirement = screen.getByTestId(
      'password-not-common-req'
    );

    expect(
      within(passwordMinCharRequirement).getByTitle('Pass')
    ).toBeInTheDocument();
    expect(
      within(passwordNotEmailRequirement).getByTitle('Pass')
    ).toBeInTheDocument();
    expect(
      within(passwordNotCommonRequirement).getByTitle('Pass')
    ).toBeInTheDocument();
    expect(screen.queryByTitle('Fail')).not.toBeInTheDocument();
  });

  it('displays alert icon when password is too short', () => {
    renderWithLocalizationProvider(
      <PasswordStrengthBalloon
        hasUserTakenAction={true}
        isTooShort={true}
        isSameAsEmail={false}
        isCommon={false}
      />
    );

    const passwordMinCharRequirement = screen.getByTestId(
      'password-min-char-req'
    );
    expect(
      within(passwordMinCharRequirement).getByTitle('Fail')
    ).toBeInTheDocument();
  });

  it('displays alert icon when password is the same as email', () => {
    renderWithLocalizationProvider(
      <PasswordStrengthBalloon
        hasUserTakenAction={true}
        isTooShort={false}
        isSameAsEmail={true}
        isCommon={false}
      />
    );

    const passwordNotEmailRequirement = screen.getByTestId(
      'password-not-email-req'
    );
    expect(
      within(passwordNotEmailRequirement).getByTitle('Fail')
    ).toBeInTheDocument();
  });

  it('displays alert icon when password is common', () => {
    renderWithLocalizationProvider(
      <PasswordStrengthBalloon
        hasUserTakenAction={true}
        isTooShort={false}
        isSameAsEmail={false}
        isCommon={true}
      />
    );

    const passwordNotCommonRequirement = screen.getByTestId(
      'password-not-common-req'
    );
    expect(
      within(passwordNotCommonRequirement).getByTitle('Fail')
    ).toBeInTheDocument();
  });
});
