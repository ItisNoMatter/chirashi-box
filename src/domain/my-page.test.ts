import { describe, expect, it } from "vitest";
import { arrangeMyPage } from "./my-page";

const today = "2026-10-11";

const exhibition = (id: string, startDate: string, endDate: string) => ({
  id,
  startDate,
  endDate,
});

const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe("arrangeMyPage", () => {
  it("気になる展示を、会期の状態ごとに開催中・もうすぐ・終了へ区切る", () => {
    const page = arrangeMyPage(
      [
        exhibition("ended", "2026-08-01", "2026-09-30"),
        exhibition("ongoing", "2026-10-01", "2026-11-30"),
        exhibition("upcoming", "2026-11-01", "2027-01-31"),
      ],
      today,
    );

    expect(ids(page.ongoing)).toEqual(["ongoing"]);
    expect(ids(page.upcoming)).toEqual(["upcoming"]);
    expect(ids(page.ended)).toEqual(["ended"]);
  });

  it("開催中は終わるのが近い順、もうすぐは始まるのが近い順、終了は終わったのが新しい順", () => {
    const page = arrangeMyPage(
      [
        exhibition("ongoing-late", "2026-10-01", "2026-12-31"),
        exhibition("ongoing-soon", "2026-09-01", "2026-10-20"),
        exhibition("upcoming-late", "2027-01-10", "2027-03-31"),
        exhibition("upcoming-soon", "2026-10-15", "2026-12-31"),
        exhibition("ended-old", "2026-06-01", "2026-07-31"),
        exhibition("ended-recent", "2026-08-01", "2026-10-05"),
      ],
      today,
    );

    expect(ids(page.ongoing)).toEqual(["ongoing-soon", "ongoing-late"]);
    expect(ids(page.upcoming)).toEqual(["upcoming-soon", "upcoming-late"]);
    expect(ids(page.ended)).toEqual(["ended-recent", "ended-old"]);
  });
});
