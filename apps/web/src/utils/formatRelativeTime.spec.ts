import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

describe("formatRelativeTime", () => {
  const now = new Date("2023-02-17T12:00:00Z");

  it("should return 'Just now' if the difference is less than a minute", () => {
    const date = new Date(now.getTime() - 1000);
    expect(formatRelativeTime(date, now)).toEqual("Just now");
  });

  it("should return 'Xm ago' if the difference is less than an hour", () => {
    const date = new Date(now.getTime() - 30 * 60 * 1000);
    expect(formatRelativeTime(date, now)).toEqual("30m ago");
  });

  it("should return 'Xh ago' if the difference is less than a day", () => {
    const date = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    expect(formatRelativeTime(date, now)).toEqual("10h ago");
  });

  it("should return a formatted date if the year is the same as the current year", () => {
    const date = new Date("2023-01-14T12:00:00Z");
    expect(formatRelativeTime(date, now)).toEqual("Jan 14");
  });

  it("should return a formatted date with year if the date is from last year", () => {
    const date = new Date("2022-06-03T12:00:00Z");
    expect(formatRelativeTime(date, now)).toEqual("Jun 3 2022");
  });
});
