/**
 * 館の画像をチラシとして出すかどうか（0029）。
 * 複数の展示で同じ画像は、サイト共通のロゴや取り違えなので、展示のチラシとして出さない。
 */
export function flyerImageOf(imageUrl: string | null, sharedImageUrls: ReadonlySet<string>): string | null {
  return imageUrl && !sharedImageUrls.has(imageUrl) ? imageUrl : null;
}
