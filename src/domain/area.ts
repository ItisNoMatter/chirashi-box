export type Area = {
  prefecture: string | null;
  municipality: string | null;
};

/** 会場の住所から、エリア（都道府県 → 市区町村）を導く（0014, 0020）。 */
export function areaOf(address: string | null): Area {
  // 「京都府」を「京都」+「府…」と読まないよう、都道府県は形を明示する。郡は市区町村の前に読み飛ばす。
  const match = address?.match(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)(?:.+?郡)?(.+?[市区町村])/);
  return { prefecture: match?.[1] ?? null, municipality: match?.[2] ?? null };
}
