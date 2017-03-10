/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

const Audit = require('./audit');
const SWAudit = require('./service-worker');
const Formatter = require('../formatters/formatter');

/**
 * @fileoverview
 * Audits if a page is configured to prompt users with the webapp install banner.
 * https://github.com/GoogleChrome/lighthouse/issues/23#issuecomment-270453303
 *
 * Requirements:
 *   * manifest is not empty
 *   * manifest has valid start url
 *   * manifest has a valid name
 *   * manifest has a valid shortname
 *   * manifest display property is either standalone or fullscreen
 *   * manifest contains icon that's a png and size >= 144px
 *   * SW is registered, and it owns this page and the manifest's start url
 *   * Site engagement score of 2 or higher

 * This audit covers these requirements with the following exceptions:
 *   * it doesn't look at standalone/fullscreen
 *   * it doesn't consider SW controlling the starturl
 *   * it doesn't consider the site engagement score (naturally)
 */

class WebappInstallBanner extends Audit {

  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: '=',
      name: '',
      description: '',
      helpText: '',
      requiredArtifacts: ['URL', 'ServiceWorker', 'Manifest']
    };
  }

  static hasServiceWorker(artifacts) {
    return SWAudit.audit(artifacts).rawValue;
  }

  static audit(artifacts) {
    const failures = [];

    return artifacts.requestManifestValues(artifacts.Manifest).then(manifestValues => {
      // 1: validate manifest is in order
      manifestValues.forEach(item => {
        if (!item.passing) {
          failures.push(item.userText);
        }
      });

      // 2: validate we have a SW
      const hasServiceWorker = WebappInstallBanner.hasServiceWorker(artifacts);
      if (!hasServiceWorker) {
        failures.push('Site registers a Service Worker.');
      }

      const extendedInfo = {
        value: {manifestValues, hasServiceWorker},
        formatter: Formatter.SUPPORTED_FORMATS.NULL
      };

      // If we fail, share the failures
      if (failures.length > 0) {
        return WebappInstallBanner.generateAuditResult({
          rawValue: false,
          debugString: `Unsatisfied requirements: ${failures.join(', ')}.`,
          extendedInfo
        });
      }

      // Otherwise, we pass
      return WebappInstallBanner.generateAuditResult({
        rawValue: true,
        extendedInfo
      });
    });
  }
}

module.exports = WebappInstallBanner;
