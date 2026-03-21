export function encode({ input, urlSafe = false }: { input: string; urlSafe?: boolean }): string {
  const encoded = btoa(
    new TextEncoder()
      .encode(input)
      .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
  );
  if (urlSafe) {
    return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return encoded;
}

export function decode({ input }: { input: string }): string {
  let normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  if (pad) {
    normalized += "=".repeat(4 - pad);
  }

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function isBase64Image({ input }: { input: string }): {
  isImage: boolean;
  mimeType?: string;
} {
  const match = input.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  if (match) {
    return { isImage: true, mimeType: match[1] };
  }
  return { isImage: false };
}

export function looksLikeBase64({ input }: { input: string }): boolean {
  if (input.length < 4) return false;
  if (input.startsWith("data:")) return true;
  return /^[A-Za-z0-9+/\-_=\s]+$/.test(input) && input.length > 20;
}
