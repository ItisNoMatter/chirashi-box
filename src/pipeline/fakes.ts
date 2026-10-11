import type { CandidateExhibition } from "@/domain/exhibition-matching";
import type {
  ExhibitionExtractor,
  Extraction,
  FetchResult,
  NewExhibition,
  NewSource,
  NewVenue,
  PageFetcher,
  PendingRegistration,
  PlaceSearch,
  RegistrationStore,
  VenueCandidate,
} from "./ports";

/** テスト用の偽物。外部（HTTP・LLM・Places）と DB の代わり（0018）。 */

export class FakePageFetcher implements PageFetcher {
  readonly fetched: string[] = [];
  constructor(private readonly pages: Record<string, FetchResult>) {}
  async fetch(url: string): Promise<FetchResult> {
    this.fetched.push(url);
    return this.pages[url] ?? { kind: "failed" };
  }
}

export class FakeExtractor implements ExhibitionExtractor {
  calls = 0;
  constructor(private readonly result: Extraction) {}
  async extract(): Promise<Extraction> {
    this.calls++;
    return this.result;
  }
}

export class FakePlaceSearch implements PlaceSearch {
  constructor(private readonly venues: VenueCandidate[]) {}
  async searchVenue(): Promise<VenueCandidate[]> {
    return this.venues;
  }
  async getVenue(placeId: string): Promise<VenueCandidate | null> {
    return this.venues.find((venue) => venue.placeId === placeId) ?? null;
  }
}

export class InMemoryRegistrationStore implements RegistrationStore {
  blockedDomains: string[] = [];
  sources = new Map<string, string>();
  venues = new Map<string, { id: string; name: string; address: string | null }>();
  exhibitions: (CandidateExhibition & { venueId: string })[] = [];
  pending: PendingRegistration[] = [];

  async listBlockedDomains() {
    return this.blockedDomains;
  }
  async findExhibitionIdBySourceUrl(url: string) {
    return this.sources.get(url) ?? null;
  }
  async findVenueIdByPlaceId(placeId: string) {
    return this.venues.get(placeId)?.id ?? null;
  }
  async listExhibitionsAtVenue(venueId: string) {
    return this.exhibitions
      .filter((exhibition) => exhibition.venueId === venueId)
      .map(({ id, title, startDate, endDate }) => ({ id, title, startDate, endDate }));
  }
  async createPendingRegistration(pending: Omit<PendingRegistration, "id" | "createdAt">) {
    const id = `pending-${this.pending.length + 1}`;
    this.pending.push({ ...pending, id, createdAt: new Date() });
    return id;
  }
  async getPendingRegistration(id: string) {
    return this.pending.find((pending) => pending.id === id) ?? null;
  }
  async deletePendingRegistration(id: string) {
    this.pending = this.pending.filter((pending) => pending.id !== id);
  }

  createdVenues: NewVenue[] = [];
  createdExhibitions: (NewExhibition & { id: string })[] = [];
  addedSources: NewSource[] = [];

  async createVenue(venue: NewVenue) {
    const id = `venue-${this.venues.size + 1}`;
    this.venues.set(venue.placeId, { id, name: venue.name, address: venue.address });
    this.createdVenues.push(venue);
    return id;
  }
  async createExhibition(exhibition: NewExhibition) {
    const id = `exhibition-new-${this.createdExhibitions.length + 1}`;
    this.createdExhibitions.push({ ...exhibition, id });
    this.exhibitions.push({ id, title: exhibition.title, startDate: exhibition.startDate, endDate: exhibition.endDate, venueId: exhibition.venueId });
    return id;
  }
  async addSource(source: NewSource) {
    this.addedSources.push(source);
    this.sources.set(source.url, source.exhibitionId);
  }
}
