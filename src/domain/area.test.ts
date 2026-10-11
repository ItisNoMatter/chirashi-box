import { describe, expect, it } from "vitest";
import { areaOf } from "./area";

describe("areaOf", () => {
  it.each([
    ["東京都港区六本木6-10-1", "東京都", "港区"],
    ["神奈川県横浜市西区みなとみらい3-4-1", "神奈川県", "横浜市"],
    ["京都府京都市左京区岡崎円勝寺町124", "京都府", "京都市"],
    ["長野県北佐久郡軽井沢町長倉", "長野県", "軽井沢町"],
    ["千葉県市川市八幡1-1", "千葉県", "市川市"],
    ["北海道札幌市中央区北1条西", "北海道", "札幌市"],
  ])("%s → %s / %s", (address, prefecture, municipality) => {
    expect(areaOf(address)).toEqual({ prefecture, municipality });
  });

  it("住所がないか、読み取れなければ null", () => {
    expect(areaOf(null)).toEqual({ prefecture: null, municipality: null });
    expect(areaOf("六本木ヒルズ森タワー53階")).toEqual({ prefecture: null, municipality: null });
  });
});
