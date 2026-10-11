import { describe, expect, it } from "vitest";
import { daysUntilEnd, periodStatusOf } from "./period";

describe("periodStatusOf", () => {
  it("会期の初日の当日は開催中", () => {
    expect(
      periodStatusOf({ startDate: "2026-10-11", endDate: "2026-12-01" }, "2026-10-11"),
    ).toBe("開催中");
  });

  it("会期の初日の前日はもうすぐ", () => {
    expect(
      periodStatusOf({ startDate: "2026-10-11", endDate: "2026-12-01" }, "2026-10-10"),
    ).toBe("もうすぐ");
  });

  it("会期の最終日の当日は開催中で、翌日は終了", () => {
    const period = { startDate: "2026-10-01", endDate: "2026-10-11" };
    expect(periodStatusOf(period, "2026-10-11")).toBe("開催中");
    expect(periodStatusOf(period, "2026-10-12")).toBe("終了");
  });
});

describe("daysUntilEnd", () => {
  it("最終日の当日はあと0日、月をまたいでも暦日で数える", () => {
    expect(daysUntilEnd({ startDate: "2026-10-01", endDate: "2026-10-11" }, "2026-10-11")).toBe(0);
    expect(daysUntilEnd({ startDate: "2026-10-01", endDate: "2026-11-02" }, "2026-10-30")).toBe(3);
  });
});
