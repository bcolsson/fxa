/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { getFtlBundle, testL10n } from 'fxa-react/lib/test-utils';
import { FluentBundle } from '@fluent/bundle';
import SignupConfirmed from '.';
import { logViewEvent, usePageViewEvent } from '../../../lib/metrics';

jest.mock('../../../lib/metrics', () => ({
  logViewEvent: jest.fn(),
  usePageViewEvent: jest.fn(),
}));

describe('SignupConfirmed', () => {
  let bundle: FluentBundle;
  beforeAll(async () => {
    bundle = await getFtlBundle('settings');
  });
  it('renders Ready component as expected', () => {
    render(<SignupConfirmed />);
    const ftlMsgMock = screen.getAllByTestId('ftlmsg-mock')[1];
    testL10n(ftlMsgMock, bundle, {
      serviceName: 'account settings',
    });

    const signupConfirmation = screen.getByText('Account confirmed');
    const serviceAvailabilityConfirmation = screen.getByText(
      'You’re now ready to use account settings'
    );
    const signupContinueButton = screen.queryByText('Continue');
    // Calling `getByText` will fail if these elements aren't in the document,
    // but we test anyway to make the intention of the test explicit
    expect(signupContinueButton).not.toBeInTheDocument();
    expect(signupConfirmation).toBeInTheDocument();
    expect(serviceAvailabilityConfirmation).toBeInTheDocument();
  });

  it('emits the expected metrics on render', () => {
    render(<SignupConfirmed />);
    expect(usePageViewEvent).toHaveBeenCalledWith('signup-confirmed', {
      entrypoint_variation: 'react',
    });
  });

  it('emits the expected metrics when a user clicks `Continue`', () => {
    render(
      <SignupConfirmed
        continueHandler={() => {
          console.log('beepboop');
        }}
      />
    );
    const passwordResetContinueButton = screen.getByText('Continue');

    fireEvent.click(passwordResetContinueButton);
    expect(logViewEvent).toHaveBeenCalledWith(
      'signup-confirmed',
      'signup-confirmed.continue',
      {
        entrypoint_variation: 'react',
      }
    );
  });
});