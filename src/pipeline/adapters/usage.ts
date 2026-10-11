import "server-only";

/** 巡回1回で使ったトークンの合計。ログに出して料金を確かめる（0012）。 */
export const usageTotal = { calls: 0, inputTokens: 0, outputTokens: 0 };

export function recordUsage(usage: { input_tokens: number; output_tokens: number }) {
  usageTotal.calls++;
  usageTotal.inputTokens += usage.input_tokens;
  usageTotal.outputTokens += usage.output_tokens;
}
