/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */

var appName = process.env.NODE_ENV === 'production' ? 'theprintlab-production' : 'theprintlab-development';

exports.config = {
  /**
   * Array of application names.
   */
  app_name : [appName],
  /**
   * Your New Relic license key.
   */
  license_key : '606a62c93b89b999f34fc6a758c1ac38474e0ea1',
  logging : {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level : 'info'
  }
};
