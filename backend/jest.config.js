export default {
  testEnvironment: "node",
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(bcryptjs)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
