import React, { useContext } from 'react';
import { Checkbox } from '../fields';
import { Plan } from '../../store/types';
import { formatPlanPricing, getLocalizedCurrency } from '../../lib/formats';
import { urlsFromProductConfig } from 'fxa-shared/subscriptions/configuration/utils';
import AppContext from '../../lib/AppContext';
import { Localized } from '@fluent/react';

export type PaymentConsentCheckboxProps = {
  plan: Plan;
  onClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
};

export const PaymentConsentCheckbox = ({
  plan,
  onClick,
}: PaymentConsentCheckboxProps) => {
  const { navigatorLanguages, config } = useContext(AppContext);

  const { termsOfService, privacyNotice } = urlsFromProductConfig(
    plan,
    navigatorLanguages,
    config.featureFlags.useFirestoreProductConfigs
  );

  const planPricing = formatPlanPricing(
    plan.amount,
    plan.currency,
    plan.interval,
    plan.interval_count
  );

  return (
    <Localized
      id={`payment-confirm-with-legal-links-${plan.interval}`}
      vars={{
        intervalCount: plan.interval_count,
        amount: getLocalizedCurrency(plan.amount, plan.currency),
      }}
      elems={{
        strong: <strong></strong>,
        termsOfServiceLink: <a href={termsOfService}>Terms of Service</a>,
        privacyNoticeLink: <a href={privacyNotice}>Privacy Notice</a>,
      }}
    >
      <Checkbox name="confirm" data-testid="confirm" onClick={onClick} required>
        I authorize Mozilla, maker of Firefox products, to charge my payment
        method <strong>{planPricing}</strong>, according to{' '}
        <a href={termsOfService}>Terms of Service</a> and{' '}
        <a href={privacyNotice}>Privacy Notice</a>, until I cancel my
        subscription.
      </Checkbox>
    </Localized>
  );
};
