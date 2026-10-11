/** "YYYY-MM-DD" 形式の日付（日本時間の暦日）。 */
export type LocalDate = string;

export type Period = {
  startDate: LocalDate;
  endDate: LocalDate;
};

export type PeriodStatus = "開催中" | "もうすぐ" | "終了";

export function periodStatusOf(period: Period, today: LocalDate): PeriodStatus {
  if (today < period.startDate) return "もうすぐ";
  if (today > period.endDate) return "終了";
  return "開催中";
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toEpochDay(date: LocalDate): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/** 「あと◯日」の日数。最終日の当日は0日（0014）。 */
export function daysUntilEnd(period: Period, today: LocalDate): number {
  return toEpochDay(period.endDate) - toEpochDay(today);
}
