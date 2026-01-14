import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

class MockIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe() {
    this.callback(
      [
        {
          isIntersecting: true,
          target: document.createElement("div"),
          intersectionRatio: 1,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ],
      this
    );
  }

  unobserve() {}

  disconnect() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

afterEach(() => {
  cleanup();
});
