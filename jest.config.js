module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
 "testMatch": [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
    "test"
  ],
  "moduleFileExtensions": ['ts', 'js'],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  "modulePathIgnorePatterns": [
    "__tests__/utils/",
    "./__tests__/data.ts"
  ],
  "coveragePathIgnorePatterns": [
    "<rootDir>/src/generated/",
    "<rootDir>/src/oidcprovider/dal/badredis.ts",
  ],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "lines": 70
    }
  }
}
