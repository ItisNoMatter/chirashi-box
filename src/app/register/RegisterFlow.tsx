"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { CandidateExhibition } from "@/domain/exhibition-matching";
import type { VenueCandidate } from "@/pipeline/ports";
import { confirmRegistration, searchVenues, startRegistration } from "./actions";

type Step =
  | { kind: "input" }
  | { kind: "venue"; pendingId: string; candidates: VenueCandidate[]; duplicates: CandidateExhibition[] }
  | { kind: "duplicate"; pendingId: string; placeId: string; candidates: CandidateExhibition[] }
  | { kind: "done"; exhibitionId: string; alreadyRegistered: boolean };

const MESSAGES: Record<string, string> = {
  email_required: "メールアドレスの確認が必要です。",
  rate_limited: "今日の登録の上限に達しました。明日また試してください。",
  invalid: "URLを確かめてください。",
  failed: "うまく読み込めませんでした。時間をおいて試してください。",
  blocked: "まとめサイトのページは登録できません。美術館の公式ページか、展覧会の特設サイトのURLを貼ってください。",
  third_party: "公式のページではないようです。公式ページのはずなら、会場のサイトの展覧会ページのURLを貼ってください。",
  robots_disallowed: "このサイトは自動での読み込みを許可していないため、登録できません。",
  fetch_failed: "ページを読み込めませんでした。URLを確かめてください。",
  not_an_exhibition: "展覧会のページではないようです。1つの展覧会を紹介しているページのURLを貼ってください。",
  not_found: "登録の途中の情報が見つかりません。最初からやり直してください。",
  expired: "時間が経ちすぎたため、最初からやり直してください。",
  invalid_venue: "会場を確かめられませんでした。選び直してください。",
  invalid_choice: "選択を確かめてください。",
};

/** URL 登録の流れ（0005, 0006, 0021）。 */
export function RegisterFlow() {
  const [step, setStep] = useState<Step>({ kind: "input" });
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<void>) {
    setError(null);
    startTransition(task);
  }

  function submitUrl(event: React.FormEvent) {
    event.preventDefault();
    run(async () => {
      const result = await startRegistration(url);
      if (result.kind === "needs_confirmation") {
        setStep({
          kind: "venue",
          pendingId: result.pendingId,
          candidates: result.venueCandidates,
          duplicates: result.duplicateCandidates,
        });
      } else if (result.kind === "already_registered") {
        setStep({ kind: "done", exhibitionId: result.exhibitionId, alreadyRegistered: true });
      } else {
        setError(MESSAGES[result.reason]);
      }
    });
  }

  function confirm(pendingId: string, placeId: string, sameAs?: string | null) {
    run(async () => {
      const result = await confirmRegistration(pendingId, placeId, sameAs);
      if (result.kind === "registered") {
        setStep({ kind: "done", exhibitionId: result.exhibitionId, alreadyRegistered: false });
      } else if (result.kind === "needs_duplicate_choice") {
        setStep({ kind: "duplicate", pendingId, placeId, candidates: result.duplicateCandidates });
      } else {
        setError(MESSAGES[result.reason]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {step.kind === "input" && (
        <form onSubmit={submitUrl} className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed">
            一覧にない展示は、美術館の公式ページか展覧会の特設サイトのURLを貼ると登録できます。
          </p>
          <input
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
            className="rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button disabled={pending} className="rounded-full bg-foreground py-2 text-sm text-background disabled:opacity-50">
            {pending ? "ページを読み込んでいます…" : "読み込む"}
          </button>
        </form>
      )}

      {step.kind === "venue" && (
        <VenueStep
          candidates={step.candidates}
          busy={pending}
          onConfirm={(placeId) => confirm(step.pendingId, placeId)}
        />
      )}

      {step.kind === "duplicate" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm">同じ会場で、同じ時期に次の展示があります。同じ展示ですか？</p>
          {step.candidates.map((candidate) => (
            <button
              key={candidate.id}
              disabled={pending}
              onClick={() => confirm(step.pendingId, step.placeId, candidate.id)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-left text-sm dark:border-neutral-700"
            >
              「{candidate.title}」と同じ
              <span className="block text-xs text-neutral-500">
                {candidate.startDate} 〜 {candidate.endDate}
              </span>
            </button>
          ))}
          <button
            disabled={pending}
            onClick={() => confirm(step.pendingId, step.placeId, null)}
            className="rounded-md border border-dashed border-neutral-400 px-3 py-2 text-sm"
          >
            どれとも違う（新しい展示として登録）
          </button>
        </div>
      )}

      {step.kind === "done" && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm">{step.alreadyRegistered ? "この展示はすでに登録されています。" : "登録しました。"}</p>
          <Link href={`/exhibitions/${step.exhibitionId}`} className="rounded-full border px-4 py-1.5 text-sm">
            展示を見る
          </Link>
          <button onClick={() => { setUrl(""); setStep({ kind: "input" }); }} className="text-xs underline">
            続けて登録する
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function VenueStep({
  candidates,
  busy,
  onConfirm,
}: {
  candidates: VenueCandidate[];
  busy: boolean;
  onConfirm: (placeId: string) => void;
}) {
  const [shown, setShown] = useState(candidates);
  const [selected, setSelected] = useState(candidates[0]?.placeId ?? null);
  const [query, setQuery] = useState("");
  const [searching, startSearch] = useTransition();
  const [searchError, setSearchError] = useState<string | null>(null);

  function search(event: React.FormEvent) {
    event.preventDefault();
    setSearchError(null);
    startSearch(async () => {
      const result = await searchVenues(query);
      if (Array.isArray(result)) {
        setShown(result);
        setSelected(result[0]?.placeId ?? null);
      } else {
        setSearchError(MESSAGES[result.reason]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">会場はこちらで合っていますか？</p>
      {shown.length === 0 && <p className="text-xs text-neutral-500">会場が見つかりませんでした。下で検索してください。</p>}
      <ul className="flex flex-col gap-2">
        {shown.map((venue) => (
          <li key={venue.placeId}>
            <label className="flex gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700">
              <input
                type="radio"
                name="venue"
                checked={selected === venue.placeId}
                onChange={() => setSelected(venue.placeId)}
              />
              <span>
                {venue.displayName}
                {venue.formattedAddress && (
                  <span className="block text-xs text-neutral-500">{venue.formattedAddress}</span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {/* Places の結果を表示するときは、Google の帰属表示が要る（0020）。 */}
      <p className="text-right text-[10px] text-neutral-500">会場の候補: Google Maps</p>

      <button
        disabled={busy || selected === null}
        onClick={() => selected && onConfirm(selected)}
        className="rounded-full bg-foreground py-2 text-sm text-background disabled:opacity-50"
      >
        この会場で登録する
      </button>

      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="違う場合は会場名で検索"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button disabled={searching} className="rounded-md border px-3 text-sm">
          検索
        </button>
      </form>
      {searchError && <p className="text-xs text-red-600">{searchError}</p>}
    </div>
  );
}
