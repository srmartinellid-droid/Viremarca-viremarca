const BASE_URL = "https://www.viremarca.com.br";

export function normalizeEncodedSlug(slug: string): string {
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    // If the input is malformed percent-encoding, encode the original value safely.
  }
  return encodeURIComponent(decodedSlug);
}

export function portfolioCanonicalUrl(slug: string): string {
  return `${BASE_URL}/portfolio/${normalizeEncodedSlug(slug)}`;
}
