import { describe, expect, it } from "vitest";
import { matchExhibition } from "./exhibition-matching";

describe("matchExhibition", () => {
  it("取得元のURLが既知なら、その展示として扱う", () => {
    const result = matchExhibition(
      { title: "オルセー美術館所蔵 印象派展", startDate: "2026-10-01", endDate: "2027-01-31" },
      { knownExhibitionId: "e1", candidatesAtVenue: [] },
    );

    expect(result).toEqual({ kind: "known", exhibitionId: "e1" });
  });

  it("同じ会場で会期が重なり、展示名が同じなら、その展示に紐づける", () => {
    const result = matchExhibition(
      { title: "ルーヴル美術館展", startDate: "2026-10-01", endDate: "2027-01-31" },
      {
        knownExhibitionId: null,
        candidatesAtVenue: [
          { id: "e1", title: "ルーヴル美術館展", startDate: "2026-10-01", endDate: "2027-01-31" },
        ],
      },
    );

    expect(result).toEqual({ kind: "matched", exhibitionId: "e1" });
  });

  it("同じ展示名でも会期が重ならなければ、新しい展示として扱う", () => {
    const result = matchExhibition(
      { title: "ルーヴル美術館展", startDate: "2028-03-01", endDate: "2028-06-30" },
      {
        knownExhibitionId: null,
        candidatesAtVenue: [
          { id: "e1", title: "ルーヴル美術館展", startDate: "2026-10-01", endDate: "2027-01-31" },
        ],
      },
    );

    expect(result).toEqual({ kind: "new" });
  });

  it("かぎ括弧・全角と半角・空白の表記揺れがあっても、同じ展示名とみなす", () => {
    const result = matchExhibition(
      { title: "「ＭＯＲＩ　Ｍａｒｉｋｏ」展", startDate: "2026-09-16", endDate: "2027-01-12" },
      {
        knownExhibitionId: null,
        candidatesAtVenue: [
          { id: "e1", title: "MORI Mariko展", startDate: "2026-09-16", endDate: "2027-01-12" },
        ],
      },
    );

    expect(result).toEqual({ kind: "matched", exhibitionId: "e1" });
  });

  it("会期が重なる展示があっても展示名が一致しなければ、会期が重なるものだけを候補として判断を保留する", () => {
    const overlapping = { id: "e1", title: "ルーヴル美術館展", startDate: "2026-10-01", endDate: "2027-01-31" };
    const result = matchExhibition(
      { title: "愛を描く ルーヴルの名品", startDate: "2026-10-01", endDate: "2027-01-31" },
      {
        knownExhibitionId: null,
        candidatesAtVenue: [
          overlapping,
          { id: "e2", title: "春のコレクション展", startDate: "2026-03-01", endDate: "2026-05-31" },
        ],
      },
    );

    expect(result).toEqual({ kind: "ambiguous", candidates: [overlapping] });
  });

  it("展示名が一致・包含する候補が複数あれば、どれかに決めず判断を保留する", () => {
    const first = { id: "e1", title: "コレクション展 第1期", startDate: "2026-10-01", endDate: "2026-12-31" };
    const second = { id: "e2", title: "コレクション展 特集展示", startDate: "2026-10-01", endDate: "2026-12-31" };
    const result = matchExhibition(
      { title: "コレクション展", startDate: "2026-10-01", endDate: "2026-12-31" },
      { knownExhibitionId: null, candidatesAtVenue: [first, second] },
    );

    expect(result).toEqual({ kind: "ambiguous", candidates: [first, second] });
  });

  it("一方の展示名が他方を含んでいれば、同じ展示とみなす（館のページと特設サイト）", () => {
    const result = matchExhibition(
      { title: "ルーヴル美術館展 愛を描く", startDate: "2026-10-01", endDate: "2027-01-31" },
      {
        knownExhibitionId: null,
        candidatesAtVenue: [
          { id: "e1", title: "ルーヴル美術館展", startDate: "2026-10-01", endDate: "2027-01-31" },
        ],
      },
    );

    expect(result).toEqual({ kind: "matched", exhibitionId: "e1" });
  });
});
