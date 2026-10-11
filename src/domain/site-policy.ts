/** サイト（ドメイン）ごとの、リンクと画像の表示の制限（0025）。 */
export type SitePolicy = {
  domain: string;
  allowLinks: boolean;
  allowImages: boolean;
};

/**
 * 表示するときに、サイトの制限を当てはめる。保存しているデータは変えない（0025）。
 * 行がない（規約をまだ確認していない）サイトは、リンクは出し、画像は確認が済むまで出さない（0028）。
 */
export function applySitePolicies<T extends { officialUrl?: string | null; imageUrl: string | null }>(
  item: T,
  policies: SitePolicy[],
): T {
  const pagePolicy = item.officialUrl ? policyFor(item.officialUrl, policies) : undefined;
  const imagePolicy = item.imageUrl ? policyFor(item.imageUrl, policies) : undefined;
  return {
    ...item,
    officialUrl: pagePolicy?.allowLinks === false ? null : item.officialUrl,
    // 画像が CDN など別のドメインにあっても、出どころのページのサイトの制限に従う。
    imageUrl: imagesAllowed(item.officialUrl ? pagePolicy : imagePolicy) && imagePolicy?.allowImages !== false ? item.imageUrl : null,
  };
}

function imagesAllowed(policy: SitePolicy | undefined): boolean {
  return policy?.allowImages === true;
}

function policyFor(url: string, policies: SitePolicy[]): SitePolicy | undefined {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return undefined;
  }
  return policies.find((policy) => host === policy.domain || host.endsWith(`.${policy.domain}`));
}
