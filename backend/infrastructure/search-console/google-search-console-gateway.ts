import type {
  AnalyticsQuery,
  GscAnalyticsRow,
  GscCoverageRow,
  SearchConsoleGateway,
} from "@backend/application/search-console/ports/search-console-gateway";
import type { FetchFn } from "./google-oauth";

const ANALYTICS_ENDPOINT = (siteUrl: string) =>
  `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
const INSPECT_ENDPOINT =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

interface AnalyticsApiRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * {@link SearchConsoleGateway} over the Google Search Console REST API.
 * Access tokens are supplied by an injected provider; `fetch` is injected too
 * so requests and response mapping can be tested.
 */
export class GoogleSearchConsoleGateway implements SearchConsoleGateway {
  constructor(
    private readonly getAccessToken: () => Promise<string>,
    private readonly fetchFn: FetchFn = fetch,
  ) {}

  async fetchAnalytics(query: AnalyticsQuery): Promise<GscAnalyticsRow[]> {
    const dimension = query.dimension === "QUERY" ? "query" : "page";
    const response = await this.fetchFn(ANALYTICS_ENDPOINT(query.siteUrl), {
      method: "POST",
      headers: await this.headers(),
      body: JSON.stringify({
        startDate: query.startDate,
        endDate: query.endDate,
        dimensions: ["date", dimension],
        rowLimit: query.rowLimit,
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Search Console analytics request failed: ${response.status}`,
      );
    }

    const json = (await response.json()) as { rows?: AnalyticsApiRow[] };
    return (json.rows ?? []).map((row) => ({
      date: row.keys[0],
      key: row.keys[1],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  async inspectUrl(siteUrl: string, page: string): Promise<GscCoverageRow> {
    const response = await this.fetchFn(INSPECT_ENDPOINT, {
      method: "POST",
      headers: await this.headers(),
      body: JSON.stringify({ inspectionUrl: page, siteUrl }),
    });
    if (!response.ok) {
      throw new Error(`URL inspection request failed: ${response.status}`);
    }

    const json = (await response.json()) as {
      inspectionResult?: {
        indexStatusResult?: {
          coverageState?: string;
          verdict?: string;
          lastCrawlTime?: string;
        };
      };
    };
    const result = json.inspectionResult?.indexStatusResult ?? {};
    return {
      page,
      coverageState: result.coverageState ?? "Unknown",
      verdict: result.verdict ?? "VERDICT_UNSPECIFIED",
      lastCrawledAt: result.lastCrawlTime ?? null,
    };
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };
  }
}
