
module.exports = (core, options) => ({
  // req.body has all settings from client
  async save(req, res) {
    return true;
  },

  // return all settings for user here
  async load(req, res) {
    return {};
  }
});
