import "server-only";
import type { PlaceSearch, VenueCandidate } from "../ports";

const ENDPOINT = "https://places.googleapis.com/v1";
/**
 * 確認の表示（名前・住所）と公式サイトの判定（websiteUri）に使う。保存するのは place_id だけ（0020）。
 * websiteUri を含むので、Text Search / Place Details の Enterprise SKU で課金される（月1,000回まで無料）。
 */
const FIELDS = ["id", "displayName", "formattedAddress", "websiteUri"];

type PlaceResponse = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  websiteUri?: string;
};

export class GooglePlaceSearch implements PlaceSearch {
  constructor(private readonly apiKey: string = requiredEnv("GOOGLE_PLACES_API_KEY")) {}

  async searchVenue({ name, address }: { name: string; address: string | null }): Promise<VenueCandidate[]> {
    const response = await fetch(`${ENDPOINT}/places:searchText`, {
      method: "POST",
      headers: this.headers(FIELDS.map((field) => `places.${field}`)),
      body: JSON.stringify({
        textQuery: [name, address].filter(Boolean).join(" "),
        languageCode: "ja",
        regionCode: "JP",
        pageSize: 5,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Places Text Search failed: ${response.status}`);
    const body = (await response.json()) as { places?: PlaceResponse[] };
    return (body.places ?? []).map(toCandidate);
  }

  async getVenue(placeId: string): Promise<VenueCandidate | null> {
    if (!/^[\w-]+$/.test(placeId)) return null;
    const response = await fetch(`${ENDPOINT}/places/${placeId}?languageCode=ja`, {
      headers: this.headers(FIELDS),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 404 || response.status === 400) return null;
    if (!response.ok) throw new Error(`Places Details failed: ${response.status}`);
    return toCandidate((await response.json()) as PlaceResponse);
  }

  private headers(fieldMask: string[]) {
    return {
      "content-type": "application/json",
      "x-goog-api-key": this.apiKey,
      "x-goog-fieldmask": fieldMask.join(","),
    };
  }
}

function toCandidate(place: PlaceResponse): VenueCandidate {
  return {
    placeId: place.id,
    displayName: place.displayName?.text ?? "",
    formattedAddress: place.formattedAddress ?? null,
    websiteUrl: place.websiteUri ?? null,
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} が設定されていません`);
  return value;
}
