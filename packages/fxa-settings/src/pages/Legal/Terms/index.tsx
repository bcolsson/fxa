/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { RouteComponentProps } from '@reach/router';
import LegalWithMarkdown from '../../../components/LegalWithMarkdown';
import { LegalDocFile } from '../../../lib/file-utils-legal';

export const viewName = 'legal-terms';

const LegalTerms = ({ locale }: { locale?: string } & RouteComponentProps) => (
  <LegalWithMarkdown
    {...{ locale, viewName }}
    headingTextFtlId="legal-terms-heading"
    headingText="Terms of Service"
    legalDocFile={LegalDocFile.terms}
  />
);

export default LegalTerms;
