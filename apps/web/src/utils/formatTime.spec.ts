import { describe, expect, it } from "vitest";
import { formatRelativeTime, formatRelativeTimeDiff } from "./formatTime";

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

describe("formatRelativeTimeDiff", () => {
  it("should return '1 minute' if the difference is less or equal a minute", () => {
    const start = new Date("2023-03-09T12:00:00Z");
    const end = new Date("2023-03-09T12:01:00Z");
    expect(formatRelativeTimeDiff(start, end)).toEqual("1 minute");

    const start2 = new Date("2023-03-09T12:00:00Z");
    const end2 = new Date("2023-03-09T12:00:00Z");
    expect(formatRelativeTimeDiff(start2, end2)).toEqual("1 minute");
  });

  it("should return 'X minutes' if the difference is less than an hour", () => {
    const start = new Date("2023-03-09T12:00:00Z");
    const end = new Date("2023-03-09T12:30:00Z");
    expect(formatRelativeTimeDiff(start, end)).toEqual("30 minutes");
  });

  it("should return '1 hour' if the difference is less or equal an day", () => {
    const start = new Date("2023-03-09T12:00:00Z");
    const end = new Date("2023-03-09T13:00:00Z");
    expect(formatRelativeTimeDiff(start, end)).toEqual("1 hour");
  });

  it("should return 'X hours' if the difference is less than an day", () => {
    const start = new Date("2023-03-09T12:00:00Z");
    const end = new Date("2023-03-09T22:30:00Z");
    expect(formatRelativeTimeDiff(start, end)).toEqual("10 hours");
  });

  it("should return '1 day' if the difference is less than an day", () => {
    const start = new Date("2023-03-09T12:00:00Z");
    const end = new Date("2023-03-10T12:00:00Z");
    expect(formatRelativeTimeDiff(start, end)).toEqual("1 day");
  });

  it("should return 'X days' if the difference is less than an day", () => {
    const start = new Date("2023-03-09T12:00:00Z");
    const end = new Date("2023-03-11T12:00:00Z");
    expect(formatRelativeTimeDiff(start, end)).toEqual("2 days");
  });
});
