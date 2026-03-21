type UrlParam = {
  key: string;
  value: string;
};

type ParsedUrl =
  | {
      isValid: true;
      protocol: string;
      host: string;
      pathname: string;
      hash: string;
      params: UrlParam[];
    }
  | {
      isValid: false;
      error: string;
    };

export function parseUrl({ input }: { input: string }): ParsedUrl {
  try {
    const url = new URL(input);
    const params: UrlParam[] = [];
    url.searchParams.forEach((value, key) => {
      params.push({ key, value });
    });
    return {
      isValid: true,
      protocol: url.protocol.replace(/:$/, ""),
      host: url.host,
      pathname: url.pathname,
      hash: url.hash,
      params,
    };
  } catch {
    return { isValid: false, error: `Invalid URL: ${input}` };
  }
}

export function buildUrl({
  protocol,
  host,
  pathname,
  hash,
  params,
}: {
  protocol: string;
  host: string;
  pathname: string;
  hash: string;
  params: UrlParam[];
}): string {
  const search = params
    .filter((p) => p.key)
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join("&");
  const queryString = search ? `?${search}` : "";
  const hashString = hash && !hash.startsWith("#") ? `#${hash}` : hash;
  return `${protocol}://${host}${pathname}${queryString}${hashString}`;
}

export function encodeUrlString({ input }: { input: string }): string {
  return encodeURIComponent(input);
}

export function decodeUrlString({ input }: { input: string }): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

export function isLikelyUrl({ input }: { input: string }): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/.+/.test(input.trim());
}
