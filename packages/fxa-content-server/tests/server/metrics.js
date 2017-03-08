/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'intern',
  'intern!object',
  'intern/chai!assert',
  'intern/dojo/node!../../server/lib/configuration',
  'intern/dojo/node!got',
  'intern/dojo/node!fs',
  'intern/dojo/node!path'
], function (intern, registerSuite, assert, config, got, fs, path) {
  var serverUrl = intern.config.fxaContentRoot.replace(/\/$/, '');

  var suite = {
    name: 'metrics'
  };

  const VALID_METRICS =
    JSON.parse(fs.readFileSync('tests/server/fixtures/metrics_valid.json'));
  const INVALID_METRICS_OVERWRITE_TOSTRING_METHOD =
    JSON.parse(fs.readFileSync('tests/server/fixtures/metrics_overwrite_toString.json'));

  suite['#post /metrics - returns 200'] = function () {
    return testValidMetricsData(VALID_METRICS, 'application/json');
  };

  suite['#post /metrics - returns 200 if Content-Type is text/plain'] = function () {
    return testValidMetricsData(VALID_METRICS, 'text/plain;charset=UTF-8');
  };

  suite['#post /metrics - returns 200 with valid data'] = {
    'valid error-type (error.unknown context.auth.108)':
        testValidMetricsEvent('type', 'error.unknown context.auth.108'),
    'valid error-type (signin-permissions.checkbox.change.profile:display_name.unchecked)':
      testValidMetricsEvent('type', 'signin-permissions.checkbox.change.profile:display_name.unchecked'),
    'valid lang (pt)': testValidMetricsField('lang', 'pt'),
    'valid lang (pt-BR)': testValidMetricsField('lang', 'pt-BR'),
    'valid lang (pt-br)': testValidMetricsField('lang', 'pt-br'),
    // negative values are allowed until we figure out the cause of #4722
    'valid navigationTiming connectEnd': testValidNavigationTimingField('connectEnd', -12),
    'valid referrer (android-app://com.google.android.gm)': testValidMetricsField('referrer', 'android-app://com.google.android.gm'),
    'valid referrer (none)': testValidMetricsField('referrer', 'none'),
    'valid screen.clientHeight (none)': testValidMetricsScreenField('clientHeight', 'none'),
    'valid screen.clientWidth (none)': testValidMetricsScreenField('clientWidth', 'none'),
    'valid screen.devicePixelRatio (none)': testValidMetricsScreenField('devicePixelRatio', 'none'),
    'valid screen.height (none)': testValidMetricsScreenField('height', 'none'),
    'valid screen.width (none)': testValidMetricsScreenField('width', 'none'),
    'valid uniqueUserId (none)': testValidMetricsField('uniqueUserId', 'none'),
    'valid utm_campaign (from firstrun)': testValidMetricsField('utm_campaign', 'page&#x2b;referral&#x2b;-&#x2b;not&#x2b;part&#x2b;of&#x2b;a&#x2b;campaign')
  };

  suite['#post /metrics - returns 400 with invalid data'] = {
    'empty body': () => testInvalidMetricsData(''),
    'invalid broker (#)': testInvalidMetricsField('broker', '#'),
    'invalid context (!)': testInvalidMetricsField('context', '!'),
    'invalid duration (-1)': testInvalidMetricsField('duration', -1),
    'invalid entryPoint (15612!$@%%asdf<>)': testInvalidMetricsField('entrypoint', '15612!$@%%asdf<>'),
    'invalid entrypoint (!%!%)': testInvalidMetricsField('entrypoint', '!%!%'),
    'invalid event offset (a)': testInvalidMetricsField('events', [{ offset: 'a', type: 'allgood'}]),
    'invalid event type (<owned>)': testInvalidMetricsField('events', [{ offset: 12, type: '<owned>'}]),
    'invalid events ({})': testInvalidMetricsField('events', {}),
    'invalid experiment choice ({})': testInvalidMetricsField('experiments', { choice: {}, group: 'treatment'}),
    'invalid experiment group (1255{})': testInvalidMetricsField('experiments', { choice: 'choice', group: '1255{}'}),
    'invalid experiments (123)': testInvalidMetricsField('experiments', '123'),
    'invalid flowBeginTime (asdf)': testInvalidMetricsField('flowBeginTime', 'asdf'),
    'invalid flowId (deadbeef)': testInvalidMetricsField('flowId', 'deadbeef'),
    'invalid flushTime (<script>)': testInvalidMetricsField('flushTime', '<script>'),
    'invalid isSampledUser (no)': testInvalidMetricsField('isSampledUser', 'no'),
    'invalid lang (es:ES)': testInvalidMetricsField('lang', 'es:ES'),
    'invalid marketing ({})': testInvalidMetricsField('marketing', {}),
    'invalid marketing campaignId (l33t!@$)': testInvalidMetricsField('marketing', [{ campaignId: 'l33t!@$', clicked: true, url: 'https://thestore.com' }]),
    'invalid marketing clicked ({})': testInvalidMetricsField('marketing', [{ campaignId: 'marketing123', clicked: {}, url: 'https://thestore.com' }]),
    'invalid marketing url (notaurl)': testInvalidMetricsField('marketing', [{ campaignId: 'marketing123', clicked: true, url: 'notaurl' }]),
    'invalid migration (not-valid)': testInvalidMetricsField('migration', 'not-valid'),
    'invalid navigationTiming ([])': testInvalidMetricsField('navigationTiming', []),
    'invalid navigationTiming connectEnd (asdf)': testInvalidNavigationTimingField('connectEnd', 'asdf'),
    'invalid navigationTiming connectStart (undefined)': testInvalidNavigationTimingField('connectStart', undefined),
    'invalid navigationTiming domComplete (#$)': testInvalidNavigationTimingField('domComplete', '#$'),
    'invalid navigationTiming domContentLoadedEventEnd ()': testInvalidNavigationTimingField('domContentLoadedEventEnd', ''),
    'invalid navigationTiming domContentLoadedEventStart (55a)': testInvalidNavigationTimingField('domContentLoadedEventStart', '55a'),
    'invalid navigationTiming domInteractive (a55)': testInvalidNavigationTimingField('domInteractive', 'a55'),
    'invalid navigationTiming domLoading ("")': testInvalidNavigationTimingField('domLoading', '""'),
    'invalid navigationTiming domainLookupEnd (|)': testInvalidNavigationTimingField('domainLookupEnd', '|'),
    'invalid navigationTiming domainLookupStart (0u000)': testInvalidNavigationTimingField('domainLookupStart', '0u000'),
    'invalid navigationTiming fetchStart (<>)': testInvalidNavigationTimingField('fetchStart', '<>'),
    'invalid navigationTiming loadEventEnd (   )': testInvalidNavigationTimingField('loadEventEnd', '   '),
    'invalid navigationTiming loadEventStart (+=)': testInvalidNavigationTimingField('loadEventStart', '+='),
    'invalid navigationTiming navigationStart (*)': testInvalidNavigationTimingField('navigationStart', '*'),
    'invalid navigationTiming redirectEnd ( )': testInvalidNavigationTimingField('redirectEnd', ' '),
    'invalid navigationTiming redirectStart (\\)': testInvalidNavigationTimingField('redirectStart', '\\'),
    'invalid navigationTiming requestStart ({})': testInvalidNavigationTimingField('requestStart', {}),
    'invalid navigationTiming responseEnd ([])': testInvalidNavigationTimingField('responseEnd', []),
    'invalid navigationTiming responseStart (true)': testInvalidNavigationTimingField('responseStart', true),
    'invalid navigationTiming secureConnectionStart (false)': testInvalidNavigationTimingField('secureConnectionStart', false),
    'invalid navigationTiming unloadEventEnd (&)': testInvalidNavigationTimingField('unloadEventEnd', '&'),
    'invalid navigationTiming unloadEventStart ([])': testInvalidNavigationTimingField('unloadEventStart', '[]'),
    'invalid numStoredAccounts ({})': testInvalidMetricsField('numStoredAccounts', {}),
    'invalid referrer (not a url)': testInvalidMetricsField('referrer', 'not a url'),
    'invalid screen (not an object)': testInvalidMetricsField('screen', 'not an object'),
    'invalid screen clientHeight (null)': testInvalidMetricsField('screen', { clientHeight: null, clientWidth: 12, devicePixelRatio: 2.3, height: 31, width: 32}), //eslint-disable-line max-len
    'invalid screen clientWidth (a)': testInvalidMetricsField('screen', { clientHeight: 10, clientWidth: 'a', devicePixelRatio: 2.3, height: 31, width: 32}),
    'invalid screen devicePixelRatio (b)': testInvalidMetricsField('screen', { clientHeight: 10, clientWidth: 12, devicePixelRatio: 'b', height: 31, width: 32}), //eslint-disable-line max-len
    'invalid screen height (undefined)': testInvalidMetricsField('screen', { clientHeight: 10, clientWidth: 12, devicePixelRatio: 2.3, height: undefined, width: 32}), //eslint-disable-line max-len
    'invalid screen width (f)': testInvalidMetricsField('screen', { clientHeight: 10, clientWidth: 12, devicePixelRatio: 2.3, height: 31, width: 'f'}),
    'invalid service (124154adf123124242123)': testInvalidMetricsField('service', '124154adf123124242123'),
    'invalid startTime (true)': testInvalidMetricsField('startTime', true),
    'invalid timers ([])': testInvalidMetricsField('timers', []),
    'invalid uniqueUserId': testInvalidMetricsField('uniqueUserId', '123-123-123-123-123-123-123-123-123-123-123-123-123-123-123-123-123-123-123'),
    'invalid utm_campaign (#)': testInvalidMetricsField('utm_campaign', '#'),
    'invalid utm_content (!)': testInvalidMetricsField('utm_content', '!'),
    'invalid utm_medium (,)': testInvalidMetricsField('utm_medium', ','),
    'invalid utm_source (>)': testInvalidMetricsField('utm_source', '>'),
    'invalid utm_term (?)': testInvalidMetricsField('utm_term', '?'),
    'overwrite `toString` method': () => testInvalidMetricsData(INVALID_METRICS_OVERWRITE_TOSTRING_METHOD)
  };

  function testValidMetricsField(fieldName, fieldValue) {
    return function () {
      var metrics = deepCopy(VALID_METRICS);
      metrics[fieldName] = fieldValue;
      return testValidMetricsData(metrics);
    };
  }

  function testValidMetricsScreenField(fieldName, fieldValue) {
    return function () {
      var metrics = deepCopy(VALID_METRICS);
      metrics.screen[fieldName] = fieldValue;
      return testValidMetricsData(metrics);
    };
  }

  function testValidMetricsEvent(fieldName, fieldValue) {
    return function () {
      var metrics = deepCopy(VALID_METRICS);
      metrics.events[0][fieldName] = fieldValue;
      return testValidMetricsData(metrics);
    };
  }

  function testValidMetricsData(body, contentType) {
    return got.post(serverUrl + '/metrics', {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': contentType || 'application/json'
      }
    }).then((res) => {
      assert.equal(res.statusCode, 200);
    });
  }

  function testValidNavigationTimingField(fieldName, fieldValue) {
    return function () {
      var metrics = deepCopy(VALID_METRICS);
      metrics.navigationTiming[fieldName] = fieldValue;
      return testValidMetricsData(metrics);
    };
  }


  function testInvalidMetricsField(fieldName, fieldValue) {
    return function () {
      var metrics = deepCopy(VALID_METRICS);
      metrics[fieldName] = fieldValue;
      return testInvalidMetricsData(metrics);
    };
  }

  function testInvalidNavigationTimingField(fieldName, fieldValue) {
    return function () {
      var metrics = deepCopy(VALID_METRICS);
      metrics.navigationTiming[fieldName] = fieldValue;
      return testInvalidMetricsData(metrics);
    };
  }

  function testInvalidMetricsData(body) {
    return got.post(serverUrl + '/metrics', {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    }).then(assert.fail, (res) => {
      assert.equal(res.statusCode, 400);
    });
  }

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  registerSuite(suite);
});
