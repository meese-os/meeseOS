
module.exports = (core, config) => ({
  async login(req, res) {
    const {username} = req.body;

    return {
      id: 1,
      username,
      groups: ['admin']
    };
  },

  async logout(req, res) {
    return true;
  },

  async register(req, res) {
    throw new Error('Registration not available');
  }
});
