module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts', '**/*.test.js'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          types: ['jest', 'node'],
        },
      },
    ],
  },
  verbose: true,
}
