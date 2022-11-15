/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { LocationProvider } from '@reach/router';
import { Meta } from '@storybook/react';
import AppLayout from '../AppLayout';
import PageAvatar from './';

export default {
  title: 'pages/Settings/Avatar',
  component: PageAvatar,
} as Meta;

export const Default = () => (
  <LocationProvider>
    <AppLayout>
      <PageAvatar />
    </AppLayout>
  </LocationProvider>
);
