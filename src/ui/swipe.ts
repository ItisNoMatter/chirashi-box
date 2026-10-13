/** 横スワイプの判定（0032）。指を離したときに1回だけ判定する。 */

export type Point = { x: number; y: number };
export type Swipe = "left" | "right";

/** これより短い横の動きは、スワイプにしない。 */
const MIN_DISTANCE = 60;
/** 横の動きが縦の何倍あればスワイプとみなすか。斜めの動きはスクロールとして扱う。 */
const MIN_RATIO = 1.5;
/** 画面の端からの動きは、iPhone の「戻る」「進む」と重なるので無視する。 */
const EDGE = 24;

export function swipeOf(start: Point, end: Point, viewportWidth: number): Swipe | null {
  if (start.x < EDGE || start.x > viewportWidth - EDGE) return null;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * MIN_RATIO) return null;
  return dx < 0 ? "left" : "right";
}
