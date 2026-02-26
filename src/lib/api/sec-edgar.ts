import { z } from "zod/v4";

const BASE_URL = "https://efts.sec.gov/LATEST";
const EDGAR_BASE = "https://data.sec.gov";

// SEC requires a User-Agent with contact info
const HEADERS = {
  "User-Agent": "Fintellection contact@fintellection.com",
  Accept: "application/json",
};

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      headers: HEADERS,
      next: { revalidate: 3600 },
    });
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
      continue;
    }
    throw new Error(`SEC EDGAR API error: ${res.status} ${res.statusText}`);
  }
  throw new Error("SEC EDGAR API: max retries exceeded");
}

// ── Schemas ──────────────────────────────────────────────────

const FilingSearchSchema = z.object({
  hits: z.object({
    hits: z.array(
      z.object({
        _id: z.string(),
        _source: z.object({
          file_date: z.string().optional(),
          display_date_filed: z.string().optional(),
          entity_name: z.string().optional(),
          file_num: z.string().optional(),
          form_type: z.string().optional(),
          file_description: z.string().optional(),
        }),
      })
    ),
    total: z.object({ value: z.number() }),
  }),
});

// ── API Functions ────────────────────────────────────────────

export async function searchFilings(
  query: string,
  forms: string[] = ["10-K", "10-Q", "8-K"],
  limit = 10
) {
  const formFilter = forms.map((f) => `"${f}"`).join(" OR ");
  const res = await fetchWithRetry(
    `${BASE_URL}/search-index?q=${encodeURIComponent(query)}&forms=${encodeURIComponent(formFilter)}&dateRange=custom&startdt=2023-01-01&enddt=2026-12-31&from=0&size=${limit}`
  );
  const data = await res.json();
  return FilingSearchSchema.parse(data);
}

export async function getCompanyFilings(cik: string, type = "10-K") {
  const paddedCik = cik.padStart(10, "0");
  const res = await fetchWithRetry(
    `${EDGAR_BASE}/submissions/CIK${paddedCik}.json`
  );
  const data = await res.json();
  return data;
}

export type SECFilingSearch = z.infer<typeof FilingSearchSchema>;
