type DecodedJwt = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
};

export function decodeJwt({ token }: { token: string }): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: expected 3 parts separated by dots");
  }

  const decodeBase64Url = (str: string): string => {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4;
    const final = pad ? padded + "=".repeat(4 - pad) : padded;
    return atob(final);
  };

  const header = JSON.parse(decodeBase64Url(parts[0]));
  const payload = JSON.parse(decodeBase64Url(parts[1]));

  return { header, payload, signature: parts[2] };
}

type ExpiryInfo = {
  expiresAt: Date | null;
  isExpired: boolean;
  timeRemaining: string;
};

export function getExpiry({ payload }: { payload: Record<string, unknown> }): ExpiryInfo {
  const exp = payload.exp;
  if (typeof exp !== "number") {
    return { expiresAt: null, isExpired: false, timeRemaining: "No expiry set" };
  }

  const expiresAt = new Date(exp * 1000);
  const now = Date.now();
  const diff = expiresAt.getTime() - now;
  const isExpired = diff <= 0;

  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);

  let timeRemaining: string;
  if (days > 0) {
    timeRemaining = `${days}d ${hours}h`;
  } else if (hours > 0) {
    timeRemaining = `${hours}h ${minutes}m`;
  } else {
    timeRemaining = `${minutes}m`;
  }

  timeRemaining = isExpired ? `expired ${timeRemaining} ago` : `expires in ${timeRemaining}`;

  return { expiresAt, isExpired, timeRemaining };
}

export function getAlgorithm({ header }: { header: Record<string, unknown> }): string {
  return typeof header.alg === "string" ? header.alg : "unknown";
}
