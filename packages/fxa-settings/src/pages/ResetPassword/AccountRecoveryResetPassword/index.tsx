/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps } from '@reach/router';
import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from '@reach/router';
import { usePageViewEvent } from '../../../lib/metrics';
import { useAlertBar } from '../../../models';
import { FtlMsg } from 'fxa-react/lib/utils';
import { useFtlMsgResolver } from '../../../models/hooks';

import LinkRememberPassword from '../../../components/LinkRememberPassword';
import LinkExpired from '../../../components/LinkExpired';
import LinkDamaged from '../../../components/LinkDamaged';
import FormPasswordWithBalloons from '../../../components/FormPasswordWithBalloons';
import { REACT_ENTRYPOINT } from '../../../constants';
import CardHeader from '../../../components/CardHeader';

// This page is based on complete_reset_password but has been separated to align with the routes.

// Users should only see this page if they initiated account recovery with a valid account recovery key
// Account recovery properties must be set to recover the account using the recovery key
// (recoveryKeyId, accountResetToken, kb)

// If lostRecoveryKey is set, redirect to /complete_reset_password

export const viewName = 'account-recovery-reset-password';

export type AccountRecoveryResetPasswordProps = {
  email: string;
  linkStatus: LinkStatus;
  forceAuth?: boolean;
};

type FormData = {
  newPassword: string;
  confirmPassword: string;
};

type LinkStatus = 'expired' | 'damaged' | 'valid';

const AccountRecoveryResetPassword = ({
  email,
  linkStatus,
  forceAuth = false,
}: AccountRecoveryResetPasswordProps & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);

  const [passwordMatchErrorText, setPasswordMatchErrorText] =
    useState<string>('');
  const alertBar = useAlertBar();
  const navigate = useNavigate();
  const ftlMsgResolver = useFtlMsgResolver();

  const { handleSubmit, register, getValues, errors, formState, trigger } =
    useForm<FormData>({
      mode: 'onTouched',
      criteriaMode: 'all',
      defaultValues: {
        newPassword: '',
        confirmPassword: '',
      },
    });

  const alertSuccessAndNavigate = useCallback(() => {
    const successCompletePwdReset = ftlMsgResolver.getMsg(
      `${viewName}-success-alert`,
      'Password set'
    );
    alertBar.success(successCompletePwdReset);
    navigate('/reset_password_with_recovery_key_verified', { replace: true });
  }, [alertBar, ftlMsgResolver, navigate]);

  const sendNewLinkEmail = () => {
    // TODO: Hook up functionality to send a new verification link
  };

  const onSubmit = () => {
    try {
      // TODO: - completeAccountPasswordResetWithRecoveryKey
      //       - logViewEvent('verification.success');
      //       - metrics.logUserPreferences('account-recovery', false)
      //       - logFlowEventOnce('recovery-key-consume.success', viewName);
      alertSuccessAndNavigate();
    } catch (e) {
      // TODO: - if token expired, re-render and show LinkExpired
      //       - metrics event for error
      //       - error feedback in alertBar
    }
  };

  return (
    <>
      {linkStatus === 'valid' && (
        <>
          <CardHeader
            headingText="Create new password"
            headingTextFtlId="create-new-password-header"
          />
          <FtlMsg id="account-restored-success-message">
            <p className="text-sm mb-4">
              You have successfully restored your account using your account
              recovery key. Create a new password to secure your data, and store
              it in a safe location.
            </p>
          </FtlMsg>

          {/* Hidden email field is to allow Fx password manager
           to correctly save the updated password. Without it,
           the password manager tries to save the old password
           as the username. */}
          <input type="email" value={email} className="hidden" readOnly />
          <section className="text-start mt-4">
            <FormPasswordWithBalloons
              {...{
                formState,
                errors,
                trigger,
                register,
                getValues,
                passwordMatchErrorText,
                setPasswordMatchErrorText,
              }}
              passwordFormType="reset"
              onSubmit={handleSubmit(onSubmit)}
              email={email}
              loading={false}
              onFocusMetricsEvent={`${viewName}.engage`}
            />
          </section>

          {/* TODO: Verify if the "Remember password?" should always direct to /signin (current state) */}
          <LinkRememberPassword {...{ email, forceAuth }} />
        </>
      )}
      {linkStatus === 'damaged' && <LinkDamaged linkType="reset-password" />}
      {/* TODO update ResetPasswordLinkExpired to receive sendNewLinkEmail() */}
      {linkStatus === 'expired' && <LinkExpired linkType="reset-password" />}
    </>
  );
};

export default AccountRecoveryResetPassword;
