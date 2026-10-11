import { type LocalDate, type Period, periodStatusOf } from "./period";

export type MyPage<T extends Period> = {
  ongoing: T[];
  upcoming: T[];
  ended: T[];
};

/** 気になるを付けた展示を、マイページの区切りに並べる（0015）。 */
export function arrangeMyPage<T extends Period>(exhibitions: T[], today: LocalDate): MyPage<T> {
  const page: MyPage<T> = { ongoing: [], upcoming: [], ended: [] };
  for (const exhibition of exhibitions) {
    switch (periodStatusOf(exhibition, today)) {
      case "開催中":
        page.ongoing.push(exhibition);
        break;
      case "もうすぐ":
        page.upcoming.push(exhibition);
        break;
      case "終了":
        page.ended.push(exhibition);
        break;
    }
  }
  page.ongoing.sort((a, b) => a.endDate.localeCompare(b.endDate));
  page.upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
  page.ended.sort((a, b) => b.endDate.localeCompare(a.endDate));
  return page;
}
