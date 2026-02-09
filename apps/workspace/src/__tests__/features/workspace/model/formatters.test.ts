import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatDuration } from "../../../../features/workspace/model/formatters";

describe("formatters", () => {
  it("formats dates with uk-UA locale", () => {
    const dateValue = "2026-02-01T12:00:00.000Z";
    const date = formatDate(dateValue);
    const dateTime = formatDateTime(dateValue);

    expect(date).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    expect(dateTime).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    expect(dateTime).toMatch(/\d{2}:\d{2}/);
  });

  it("formats duration", () => {
    expect(formatDuration(65)).toBe("1:05");
  });
});
