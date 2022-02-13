
class ServiceProvider {

  /**
   * Constructor
   * @param {Core} core Core reference
   */
  constructor(core, options = {}) {
    /**
     * Core instance reference
     * @type {Core}
     */
    this.core = core;
    this.options = options;
  }

  /**
   * A list of services this provider can create
   * @desc Used for resolving a dependency graph
   * @return {string[]}
   */
  provides() {
    return [

    ];
  }

  /**
   * Initializes provider
   */
  init() {
    return Promise.resolve();
  }

  /**
   * Starts provider
   */
  start() {
  }

  /**
   * Destroys provider
   */
  destroy() {
  }

}

module.exports = ServiceProvider;
