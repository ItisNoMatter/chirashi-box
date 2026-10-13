import { describe, expect, it } from "vitest";
import { swipeOf } from "./swipe";

const width = 390;
const at = (x: number, y: number) => ({ x, y });

describe("swipeOf", () => {
  it("左へはっきり動かしたら left", () => {
    expect(swipeOf(at(300, 400), at(180, 420), width)).toBe("left");
  });

  it("右へはっきり動かしたら right", () => {
    expect(swipeOf(at(100, 400), at(220, 390), width)).toBe("right");
  });

  it("動きが短ければスワイプにしない", () => {
    expect(swipeOf(at(200, 400), at(160, 400), width)).toBeNull();
  });

  it("縦の動きが大きい斜めの動きはスクロールとみなす", () => {
    expect(swipeOf(at(300, 400), at(200, 250), width)).toBeNull();
  });

  it("画面の左端から始まった動きは、iPhone の「戻る」と重なるので無視する", () => {
    expect(swipeOf(at(10, 400), at(200, 400), width)).toBeNull();
  });

  it("画面の右端から始まった動きも無視する", () => {
    expect(swipeOf(at(385, 400), at(200, 400), width)).toBeNull();
  });
});
