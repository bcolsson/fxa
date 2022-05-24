/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const isA = require('@hapi/joi');
const createBackendServiceAPI = require('../backendService');

const PATH_PREFIX = '/v1';

// Very generic validator, because there's not really a useful response
// here other than that it didn't fail in error
const DeleteCacheResponse = isA.any();

const UpdateDisplayNameResponse = isA.any();
const UpdateAvatarResponse = isA.any();

const UpdateAvatarResponse = isA.any();

module.exports = function (log, config, statsd) {
  const ProfileAPI = createBackendServiceAPI(
    log,
    config,
    'subhub',
    {
      deleteCache: {
        path: `${PATH_PREFIX}/cache/:uid`,
        method: 'DELETE',
        validate: {
          params: {
            uid: isA.string().required(),
          },
          response: DeleteCacheResponse,
        },
      },
      updateDisplayName: {
        path: `${PATH_PREFIX}/_display_name/:uid`,
        method: 'POST',
        validate: {
          params: {
            uid: isA.string().required(),
          },
          payload: {
            name: isA.string().required(),
          },
          response: UpdateDisplayNameResponse,
        }
      },
      updateAvatarWithUrl: {
        path: `${PATH_PREFIX}/avatar/updateWithUrl/:uid/:picture`,
        method: 'POST',
        validate: {
          params: {
            uid: isA.string().required(),
          },
          payload: {
            imageUrl: isA.string().required(),
          },
          response: UpdateAvatarResponse,
        }
      },
      updateAvatar: {
        path: `${PATH_PREFIX}/avatar/auth/:uid`,
        method: 'POST',
        validate: {
          params: {
            uid: isA.string().required(),
          },
          payload: {
            imageUrl: isA.string().required(),
          },
          response: UpdateAvatarResponse,
        }
      }
    },
    statsd
  );

  const api = new ProfileAPI(config.profileServer.url, {
    headers: {
      Authorization: `Bearer ${config.profileServer.secretBearerToken}`,
    },
    timeout: 15000,
  });

  return {
    async deleteCache(uid) {
      try {
        return await api.deleteCache(uid);
      } catch (err) {
        log.error('profile.deleteCache.failed', { uid, err });
        throw err;
      }
    },
    async updateDisplayName(uid, name) {
      try {
        return await api.updateDisplayName(uid, { name: name });
      } catch (err) {
        log.error('profile.updateDisplayName.failed', { uid, name, err});
        throw err;
      }
    },
    async updateAvatarWithUrl(uid, picture) {
      try {
        return await api.updateProfileName(uid, { imageUrl: picture });
      } catch (err) {
        log.error('profile.updateProfileName.failed', { uid, imageUrl: picture, err});
        throw err;
      }
    },
    async updateAvatar(uid, imageUrl) {
      try {
        return await api.updateAvatar(uid, { imageUrl: imageUrl });
      } catch (err) {
        log.error('profile.updateAvatar.failed', { uid, imageUrl, err});
        throw err;
      }
    },
  };
};
