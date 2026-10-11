"use client";

import { useState, useSyncExternalStore } from "react";

const DISMISSED_KEY = "install-hint-dismissed";

/**
 * iPhone でホーム画面への追加を案内する帯（0013）。
 * iOS のブラウザは追加の案内を自分では出さないので、アプリが手順を伝える。
 * ホーム画面から開いたとき（standalone）と、一度閉じたあとは出さない。
 */
export function InstallHint() {
  const shouldShow = useSyncExternalStore(subscribe, shouldShowHint, () => false);
  const [dismissed, setDismissed] = useState(false);
  if (!shouldShow || dismissed) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // 保存できなくても、この画面では閉じる。
    }
    setDismissed(true);
  }

  return (
    <div className="flex items-start gap-3 border-b border-neutral-200 bg-amber-50 px-4 py-2.5 text-sm text-neutral-800 dark:border-neutral-800 dark:bg-amber-950/40 dark:text-neutral-100">
      <p className="flex-1 leading-relaxed">
        画面下の共有ボタン
        <ShareIcon />
        から「ホーム画面に追加」を選ぶと、アプリとして使えます。
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="案内を閉じる"
        className="-mr-1 rounded px-2 py-0.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        ✕
      </button>
    </div>
  );
}

function subscribe() {
  // 表示の条件は開いている間に変わらないので、購読するものはない。
  return () => {};
}

function shouldShowHint(): boolean {
  const ua = navigator.userAgent;
  // iPadOS の Safari は Mac を名乗るので、タッチ操作の有無で見分ける。
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;
  const standalone =
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true) ||
    matchMedia("(display-mode: standalone)").matches;
  if (standalone) return false;
  try {
    return localStorage.getItem(DISMISSED_KEY) !== "1";
  } catch {
    return true;
  }
}

function ShareIcon() {
  return (
    <svg
      aria-label="共有"
      role="img"
      viewBox="0 0 24 24"
      className="mx-0.5 inline-block h-4 w-4 -translate-y-0.5 align-middle"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" />
    </svg>
  );
}
