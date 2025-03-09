import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Run cleanup after each test case
afterEach(() => {
  cleanup();
});
