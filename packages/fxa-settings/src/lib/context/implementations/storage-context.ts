/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BaseContext } from './base-context';

// TODO: Adapt to using ../../storage implementation. We need a way to migrate / deal with the namespace issue though.

/**
 * Uses window.sessionStorage or window.localStorage to hold state.
 */
export class StorageContext extends BaseContext {
  private static readonly NAMESPACE = '__fxa_session';
  private static readonly PERSIST_TO_LOCAL_STORAGE = ['oauth'];

  private state: Record<string, unknown>;

  constructor(private window: Window) {
    super();
    this.state = {};
    this.load();
  }

  public requiresSync() {
    return true;
  }

  public load() {
    let values = {};

    // Try parsing sessionStorage values
    try {
      const sessionStorageValueRaw = this.window.sessionStorage.getItem(
        StorageContext.NAMESPACE
      );
      if (sessionStorageValueRaw != null) {
        values = {
          ...values,
          ...JSON.parse(sessionStorageValueRaw),
        };
      }
    } catch (e) {
      console.error('Cannot save to session storage');
      // ignore the parse error.
    }

    // Try parsing localStorage values
    try {
      const localStorageValueRaw = this.window.localStorage.getItem(
        StorageContext.NAMESPACE
      );
      if (localStorageValueRaw != null) {
        values = {
          ...values,
          ...JSON.parse(localStorageValueRaw),
        };
      }
    } catch (e) {
      console.error('Cannot save to local storage');
      // ignore the parse error.
    }

    this.state = values;
  }

  public persist() {
    const toSaveToSessionStorage: Record<string, any> = {};
    const toSaveToLocalStorage: Record<string, any> = {};

    for (const key in this.state) {
      const value = this.state[key];

      if (StorageContext.PERSIST_TO_LOCAL_STORAGE.indexOf(key) >= 0) {
        toSaveToLocalStorage[key] = value;
      } else {
        toSaveToSessionStorage[key] = value;
      }
    }

    // Wrap browser storage access in a try/catch block because some browsers
    // (Firefox, Chrome) except when trying to access browser storage and
    // cookies are disabled.
    try {
      this.window.localStorage.setItem(
        StorageContext.NAMESPACE,
        JSON.stringify(toSaveToLocalStorage)
      );
      this.window.sessionStorage.setItem(
        StorageContext.NAMESPACE,
        JSON.stringify(toSaveToSessionStorage)
      );
    } catch (e) {
      // some browsers disable access to browser storage
      // if cookies are disabled.
      console.error('Error saving local state');
    }
  }

  public getKeys() {
    return Object.keys(this.state);
  }

  public get(key: string) {
    return this.state[key];
  }

  public set(key: string, value: unknown) {
    this.state[key] = value;
  }
}
