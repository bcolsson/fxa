import React, { useContext, useState } from 'react';
import { Plan, Customer, Profile } from '../../../store/types';
import { AppContext } from '../../../lib/AppContext';

import { urlsFromProductConfig } from 'fxa-shared/subscriptions/configuration/utils';

import PlanDetails from '../../../components/PlanDetails';
import PaymentConfirmation from '../../../components/PaymentConfirmation';
import Header from '../../../components/Header';
import { CouponDetails } from 'fxa-shared/dto/auth/payments/coupon';
import CouponForm from '../../../components/CouponForm';
import { FirstInvoicePreview } from 'fxa-shared/dto/auth/payments/invoice';

const defaultProductRedirectURL = 'https://mozilla.org';

export type SubscriptionSuccessProps = {
  customer: Customer;
  plan: Plan;
  profile: Profile;
  isMobile: boolean;
  accountExists?: boolean;
  coupon?: CouponDetails;
};

export const SubscriptionSuccess = ({
  customer,
  plan,
  profile,
  isMobile,
  accountExists = true,
  coupon,
}: SubscriptionSuccessProps) => {
  const { product_id } = plan;
  const {
    config: { productRedirectURLs, featureFlags },
    navigatorLanguages,
  } = useContext(AppContext);

  const { successActionButton } = urlsFromProductConfig(
    plan,
    navigatorLanguages,
    featureFlags.useFirestoreProductConfigs
  );

  const [invoice, setInvoice] = useState<FirstInvoicePreview>();

  const productUrl =
    successActionButton ||
    productRedirectURLs[product_id] ||
    defaultProductRedirectURL;

  return (
    <>
      <Header {...{ profile }} />
      <div className="main-content">
        <PaymentConfirmation
          {...{
            profile: profile,
            selectedPlan: plan,
            customer: customer,
            productUrl,
            accountExists,
            invoice,
          }}
        />

        <div className="payment-panel">
          <PlanDetails
            {...{
              className: 'rounded-plan',
              selectedPlan: plan,
              isMobile,
              showExpandButton: isMobile,
              coupon: coupon,
              setInvoice: setInvoice,
            }}
          />

          {coupon ? (
            <CouponForm
              readOnly={true}
              subscriptionInProgress={false}
              setCoupon={() => {}}
              {...{ planId: plan.plan_id, coupon }}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};

export default SubscriptionSuccess;
