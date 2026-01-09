/**
 * Run a single test with detailed output
 * Usage: node tests/run-single-test.js <test-file-path>
 * Example: node tests/run-single-test.js tests/api/metadata.test.js
 */

const { spawn } = require('child_process');
const path = require('path');

const testFile = process.argv[2];

if (!testFile) {
  console.error('Usage: node tests/run-single-test.js <test-file-path>');
  console.error('Example: node tests/run-single-test.js tests/api/metadata.test.js');
  process.exit(1);
}

const testPath = path.resolve(testFile);

console.log(`Running test: ${testPath}\n`);

const jest = spawn('npx', ['jest', testPath, '--verbose', '--no-coverage'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'test',
  },
});

jest.on('close', (code) => {
  process.exit(code);
});
