import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/vue";
import matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect method with methods from @testing-library/jest-dom
expect.extend(matchers);

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
