import type { Period } from "./period";

export type ExtractedExhibition = Period & {
  title: string;
};

export type CandidateExhibition = Period & {
  id: string;
  title: string;
};

export type MatchContext = {
  /** 取得元の URL が exhibition_sources に既にあれば、その展示の id。 */
  knownExhibitionId: string | null;
  /** 同じ会場の展示。 */
  candidatesAtVenue: CandidateExhibition[];
};

export type MatchResult =
  | { kind: "known"; exhibitionId: string }
  | { kind: "matched"; exhibitionId: string }
  | { kind: "ambiguous"; candidates: CandidateExhibition[] }
  | { kind: "new" };

/** 展示の段階的な照合（0003, 0006）。 */
export function matchExhibition(extracted: ExtractedExhibition, context: MatchContext): MatchResult {
  if (context.knownExhibitionId !== null) {
    return { kind: "known", exhibitionId: context.knownExhibitionId };
  }
  const overlapping = context.candidatesAtVenue.filter((candidate) => overlaps(candidate, extracted));
  const title = normalizeTitle(extracted.title);
  const sameTitle = overlapping.filter((candidate) => {
    const candidateTitle = normalizeTitle(candidate.title);
    return candidateTitle.includes(title) || title.includes(candidateTitle);
  });
  if (sameTitle.length === 1) {
    return { kind: "matched", exhibitionId: sameTitle[0].id };
  }
  if (sameTitle.length > 1) {
    return { kind: "ambiguous", candidates: sameTitle };
  }
  if (overlapping.length > 0) {
    // 名前が一致しない重複候補は、URL登録では登録者が、巡回では LLM が判定する（0006）。
    return { kind: "ambiguous", candidates: overlapping };
  }
  return { kind: "new" };
}

/**
 * 照合用に展示名の表記揺れをならす。exhibitions.normalized_title にも同じ値を保存する。
 * NFKC で全角英数・全角空白を半角にそろえ、大文字小文字・空白・括弧類を無視する。
 */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s「」『』【】〈〉《》"'“”‘’()]/g, "");
}

function overlaps(a: Period, b: Period): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}
