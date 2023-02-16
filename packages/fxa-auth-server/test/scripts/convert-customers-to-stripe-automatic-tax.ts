/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import cp from 'child_process';
import util from 'util';
import path from 'path';
import sinon from 'sinon';
import { expect } from 'chai';
import Container from 'typedi';

import { ConfigType } from '../../config';
import { AppConfig, AuthFirestore } from '../../lib/types';

import { StripeAutomaticTaxConverter } from '../../scripts/convert-customers-to-stripe-automatic-tax/convert-customers-to-stripe-automatic-tax';
import {
  FirestoreSubscription,
  StripeAutomaticTaxConverterHelpers,
} from '../../scripts/convert-customers-to-stripe-automatic-tax/helpers';
import Stripe from 'stripe';

import plan1 from '../local/payments/fixtures/stripe/plan1.json';
import product1 from '../local/payments/fixtures/stripe/product1.json';
import customer1 from '../local/payments/fixtures/stripe/customer1.json';
import subscription1 from '../local/payments/fixtures/stripe/subscription1.json';
import invoicePreviewTax from '../local/payments/fixtures/stripe/invoice_preview_tax.json';

const mockPlan = plan1 as unknown as Stripe.Plan;
const mockProduct = product1 as unknown as Stripe.Product;
const mockCustomer = customer1 as unknown as Stripe.Customer;
const mockSubscription = subscription1 as unknown as FirestoreSubscription;
const mockInvoicePreview = invoicePreviewTax as unknown as Stripe.Invoice;

const ROOT_DIR = '../..';
const execAsync = util.promisify(cp.exec);
const cwd = path.resolve(__dirname, ROOT_DIR);
const execOptions = {
  cwd,
  env: {
    ...process.env,
    NODE_ENV: 'dev',
    LOG_LEVEL: 'error',
    AUTH_FIRESTORE_EMULATOR_HOST: 'localhost:9090',
  },
};

describe('starting script', () => {
  it('does not fail', function () {
    this.timeout(20000);
    return execAsync(
      'node -r esbuild-register scripts/remove-unverified-accounts.ts',
      execOptions
    );
  });
});

const mockConfig = {
  authFirestore: {
    prefix: 'mock-fxa-',
  },
  subscriptions: {
    playApiServiceAccount: {
      credentials: {
        clientEmail: 'mock-client-email',
      },
      keyFile: 'mock-private-keyfile',
    },
    productConfigsFirestore: {
      schemaValidation: {
        cdnUrlRegex: '^http',
      },
    },
  },
} as unknown as ConfigType;

describe('StripeAutomaticTaxConverter', () => {
  let stripeAutomaticTaxConverter: StripeAutomaticTaxConverter;
  let helperStub: sinon.SinonStubbedInstance<StripeAutomaticTaxConverterHelpers>;
  let stripeStub: Stripe;
  let firestoreGetStub: sinon.SinonStub;

  beforeEach(() => {
    firestoreGetStub = sinon.stub();
    Container.set(AuthFirestore, {
      collectionGroup: sinon.stub().returns({
        where: sinon.stub().returnsThis(),
        orderBy: sinon.stub().returnsThis(),
        startAfter: sinon.stub().returnsThis(),
        limit: sinon.stub().returnsThis(),
        get: firestoreGetStub,
      }),
    });

    Container.set(AppConfig, mockConfig);

    helperStub = sinon.createStubInstance(StripeAutomaticTaxConverterHelpers);
    Container.set(StripeAutomaticTaxConverterHelpers, helperStub);

    stripeStub = {
      products: {},
      customers: {},
      subscriptions: {},
      invoices: {},
    } as Stripe;

    stripeAutomaticTaxConverter = new StripeAutomaticTaxConverter(
      false,
      100,
      './stripe-automatic-tax-converter.tmp.csv',
      stripeStub
    );
  });

  describe('convert', () => {
    let fetchSubsBatchStub: sinon.SinonStub;
    let generateReportForSubscriptionStub: sinon.SinonStub;
    const mockSubs = [mockSubscription];

    beforeEach(async () => {
      fetchSubsBatchStub = sinon
        .stub()
        .onFirstCall()
        .returns(mockSubs)
        .onSecondCall()
        .returns([]);
      stripeAutomaticTaxConverter.fetchSubsBatch = fetchSubsBatchStub;

      generateReportForSubscriptionStub = sinon.stub();
      stripeAutomaticTaxConverter.generateReportForSubscription =
        generateReportForSubscriptionStub;

      helperStub.filterEligibleSubscriptions.callsFake(
        (subscriptions) => subscriptions
      );

      await stripeAutomaticTaxConverter.convert();
    });

    it('fetches subscriptions until no results', () => {
      expect(fetchSubsBatchStub.callCount).eq(2);
    });

    it('filters ineligible subscriptions', () => {
      expect(helperStub.filterEligibleSubscriptions.callCount).eq(2);
      expect(helperStub.filterEligibleSubscriptions.calledWith(mockSubs)).true;
    });

    it('generates a report for each applicable subscription', () => {
      expect(generateReportForSubscriptionStub.callCount).eq(1);
    });
  });

  describe('fetchSubsBatch', () => {
    const mockSubscriptionId = 'mock-id';
    let result: FirestoreSubscription[];

    beforeEach(async () => {
      firestoreGetStub.resolves({
        docs: [
          {
            data: sinon.stub().returns(mockSubscription),
          },
        ],
      });

      result = await stripeAutomaticTaxConverter.fetchSubsBatch(
        mockSubscriptionId
      );
    });

    it('returns a list of subscriptions from Firestore', () => {
      sinon.assert.match(result, [mockSubscription]);
    });
  });

  describe('generateReportForSubscription', () => {
    const mockFirestoreSub = {
      id: 'test',
      customer: 'test',
      plan: {
        product: 'example-product',
      },
    } as FirestoreSubscription;
    let logStub: sinon.SinonStub;
    let enableTaxForCustomer: sinon.SinonStub;
    let enableTaxForSubscription: sinon.SinonStub;
    let fetchInvoicePreview: sinon.SinonStub;
    let buildReport: sinon.SinonStub;

    beforeEach(async () => {
      stripeStub.products.retrieve = sinon.stub().resolves(mockProduct);
      stripeAutomaticTaxConverter.fetchCustomer = sinon
        .stub()
        .resolves(mockCustomer);
      enableTaxForCustomer = sinon.stub().resolves(true);
      stripeAutomaticTaxConverter.enableTaxForCustomer = enableTaxForCustomer;
      enableTaxForSubscription = sinon.stub().resolves();
      stripeAutomaticTaxConverter.enableTaxForSubscription =
        enableTaxForSubscription;
      fetchInvoicePreview = sinon.stub().resolves(mockInvoicePreview);
      stripeAutomaticTaxConverter.fetchInvoicePreview = fetchInvoicePreview;
      // TODO FXA-6581: Update and validate buildReport
      buildReport = sinon.stub().returns('example-report');
      stripeAutomaticTaxConverter.buildReport = buildReport;
      logStub = sinon.stub(console, 'log');
    });

    afterEach(() => {
      logStub.restore();
    });

    describe('success', () => {
      beforeEach(async () => {
        await stripeAutomaticTaxConverter.generateReportForSubscription(
          mockFirestoreSub
        );
      });

      it('enables stripe tax for customer', () => {
        expect(enableTaxForCustomer.calledWith(mockCustomer)).true;
      });

      it('enables stripe tax for subscription', () => {
        expect(enableTaxForSubscription.calledWith(mockFirestoreSub.id)).true;
      });

      it('fetches an invoice preview', () => {
        expect(fetchInvoicePreview.calledWith(mockFirestoreSub.id)).true;
      });

      it('logs the report to stdout', () => {
        expect(logStub.calledWith('report:', 'example-report')).true;
      });
    });

    describe('invalid', () => {
      it('aborts if customer does not exist', async () => {
        stripeAutomaticTaxConverter.fetchCustomer = sinon.stub().resolves(null);
        await stripeAutomaticTaxConverter.generateReportForSubscription(
          mockFirestoreSub
        );

        expect(enableTaxForCustomer.notCalled).true;
        expect(enableTaxForSubscription.notCalled).true;
        expect(logStub.notCalled).true;
      });

      it('aborts if customer is not taxable', async () => {
        stripeAutomaticTaxConverter.enableTaxForCustomer = sinon
          .stub()
          .resolves(false);
        await stripeAutomaticTaxConverter.generateReportForSubscription(
          mockFirestoreSub
        );

        expect(enableTaxForCustomer.notCalled).true;
        expect(enableTaxForSubscription.notCalled).true;
        expect(logStub.notCalled).true;
      });
    });
  });

  describe('fetchCustomer', () => {
    let customerRetrieveStub: sinon.SinonStub;
    let result: Stripe.Customer | null;

    describe('customer exists', () => {
      beforeEach(async () => {
        customerRetrieveStub = sinon.stub().resolves(mockCustomer);
        stripeStub.customers.retrieve = customerRetrieveStub;

        result = await stripeAutomaticTaxConverter.fetchCustomer(
          mockCustomer.id
        );
      });

      it('fetches customer from Stripe', () => {
        expect(
          customerRetrieveStub.calledWith(mockCustomer.id, {
            expand: ['tax'],
          })
        ).true;
      });

      it('returns customer', () => {
        sinon.assert.match(result, mockCustomer);
      });
    });

    describe('customer deleted', () => {
      beforeEach(async () => {
        const deletedCustomer = {
          ...mockCustomer,
          deleted: true,
        };
        customerRetrieveStub = sinon.stub().resolves(deletedCustomer);
        stripeStub.customers.retrieve = customerRetrieveStub;

        result = await stripeAutomaticTaxConverter.fetchCustomer(
          mockCustomer.id
        );
      });

      it('returns null', () => {
        sinon.assert.match(result, null);
      });
    });
  });

  describe('enableTaxForCustomer', () => {
    let updateStub: sinon.SinonStub;
    let result: boolean;

    describe('tax already enabled', () => {
      beforeEach(async () => {
        helperStub.isTaxEligible.returns(true);
        updateStub = sinon.stub().resolves(mockCustomer);
        stripeStub.customers.update = updateStub;

        result = await stripeAutomaticTaxConverter.enableTaxForCustomer(
          mockCustomer
        );
      });

      it('does not update customer', () => {
        expect(updateStub.notCalled).true;
      });

      it('returns true', () => {
        expect(result).true;
      });
    });

    describe('tax not enabled', () => {
      beforeEach(async () => {
        helperStub.isTaxEligible
          .onFirstCall()
          .returns(false)
          .onSecondCall()
          .returns(true);
        updateStub = sinon.stub().resolves(mockCustomer);
        stripeStub.customers.update = updateStub;
        stripeAutomaticTaxConverter.fetchCustomer = sinon
          .stub()
          .resolves(mockCustomer);

        result = await stripeAutomaticTaxConverter.enableTaxForCustomer(
          mockCustomer
        );
      });

      it('updates customer', () => {
        expect(
          updateStub.calledWith(mockCustomer.id, {
            tax: {
              ip_address: undefined,
            },
          })
        ).true;
      });
    });
  });

  describe('enableTaxForSubscription', () => {
    let updateStub: sinon.SinonStub;

    beforeEach(async () => {
      updateStub = sinon.stub().resolves(mockSubscription);
      stripeStub.subscriptions.update = updateStub;

      await stripeAutomaticTaxConverter.enableTaxForSubscription(
        mockSubscription.id
      );
    });

    it('updates the subscription', () => {
      expect(
        updateStub.calledWith(mockSubscription.id, {
          automatic_tax: {
            enabled: true,
          },
        })
      ).true;
    });
  });

  describe('fetchInvoicePreview', () => {
    let result: Stripe.Invoice;
    let stub: sinon.SinonStub;

    beforeEach(async () => {
      stub = sinon.stub().resolves(mockInvoicePreview);
      stripeStub.invoices.retrieveUpcoming = stub;

      result = await stripeAutomaticTaxConverter.fetchInvoicePreview(
        mockSubscription.id
      );
    });

    it('calls stripe for the invoice preview', () => {
      expect(
        stub.calledWith({
          subscription: mockSubscription.id,
          expand: ['total_tax_amounts.tax_rate'],
        })
      ).true;
    });

    it('returns invoice preview', () => {
      sinon.assert.match(result, mockInvoicePreview);
    });
  });

  describe('buildReport', () => {
    it('returns a report', () => {
      const mockSpecialTaxAmounts = {
        hst: 10,
        gst: 11,
        pst: 12,
        qst: 13,
        rst: 14,
      };
      helperStub.getSpecialTaxAmounts.returns(mockSpecialTaxAmounts);

      // Invoice preview with tax doesn't include total_excluding_tax which we need
      const _mockInvoicePreview = {
        ...mockInvoicePreview,
        total_excluding_tax: 10,
      };

      const result = stripeAutomaticTaxConverter.buildReport(
        mockCustomer,
        mockSubscription,
        mockProduct,
        mockPlan,
        _mockInvoicePreview
      );

      sinon.assert.match(result, [
        mockCustomer.metadata.userid,
        mockCustomer.email,
        mockProduct.id,
        mockProduct.name,
        mockPlan.id,
        mockPlan.nickname,
        mockPlan.interval_count,
        mockPlan.interval,
        _mockInvoicePreview.total_excluding_tax,
        _mockInvoicePreview.tax,
        mockSpecialTaxAmounts.hst,
        mockSpecialTaxAmounts.gst,
        mockSpecialTaxAmounts.pst,
        mockSpecialTaxAmounts.qst,
        mockSpecialTaxAmounts.rst,
        _mockInvoicePreview.total,
        mockSubscription.current_period_end,
      ]);
    });
  });
});
