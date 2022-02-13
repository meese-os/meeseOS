
const myAdapter = (core, options) => ({
  // Create your own request here with 'values' settings
  async save(values) {
    return true;
  },

  // Create your own request here and return settings
  async load() {
    return {};
  }
});

export default myAdapter;
