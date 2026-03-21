type ParsedCurl = {
  isValid: true;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  auth: { type: string; value: string } | null;
};

type ParseError = {
  isValid: false;
  error: string;
};

export type CurlResult = ParsedCurl | ParseError;

function tokenize({ input }: { input: string }): string[] {
  // Join backslash-continued lines
  const joined = input.replace(/\\\s*\n/g, " ").trim();
  const tokens: string[] = [];
  let i = 0;

  while (i < joined.length) {
    // Skip whitespace
    if (/\s/.test(joined[i])) {
      i++;
      continue;
    }

    // Quoted string (single or double)
    if (joined[i] === '"' || joined[i] === "'") {
      const quote = joined[i];
      let token = "";
      i++; // skip opening quote
      while (i < joined.length && joined[i] !== quote) {
        if (joined[i] === "\\" && i + 1 < joined.length) {
          // Handle escape sequences inside double quotes
          if (quote === '"') {
            const next = joined[i + 1];
            if (next === '"' || next === "\\" || next === "n" || next === "t") {
              token += next === "n" ? "\n" : next === "t" ? "\t" : next;
              i += 2;
              continue;
            }
          }
          token += joined[i + 1];
          i += 2;
          continue;
        }
        token += joined[i];
        i++;
      }
      i++; // skip closing quote
      tokens.push(token);
      continue;
    }

    // Unquoted token
    let token = "";
    while (i < joined.length && !/\s/.test(joined[i])) {
      token += joined[i];
      i++;
    }
    tokens.push(token);
  }

  return tokens;
}

export function isCurlCommand({ input }: { input: string }): boolean {
  const trimmed = input.trim().replace(/\\\s*\n/g, " ");
  return /^curl\s/i.test(trimmed);
}

export function parseCurl({ input }: { input: string }): CurlResult {
  const trimmed = input.trim();
  if (!isCurlCommand({ input: trimmed })) {
    return { isValid: false, error: "Input does not start with 'curl'" };
  }

  const tokens = tokenize({ input: trimmed });

  // Remove leading "curl" token
  if (tokens.length === 0 || tokens[0].toLowerCase() !== "curl") {
    return { isValid: false, error: "Input does not start with 'curl'" };
  }
  tokens.shift();

  let method: string | null = null;
  let url: string | null = null;
  const headers: Record<string, string> = {};
  let body: string | null = null;
  let auth: { type: string; value: string } | null = null;

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === "-X" || token === "--request") {
      i++;
      if (i < tokens.length) {
        method = tokens[i].toUpperCase();
      }
    } else if (token === "-H" || token === "--header") {
      i++;
      if (i < tokens.length) {
        const colonIdx = tokens[i].indexOf(":");
        if (colonIdx > 0) {
          const key = tokens[i].slice(0, colonIdx).trim();
          const value = tokens[i].slice(colonIdx + 1).trim();
          headers[key] = value;
        }
      }
    } else if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary" ||
      token === "--data-urlencode"
    ) {
      i++;
      if (i < tokens.length) {
        body = tokens[i];
      }
    } else if (token === "-u" || token === "--user") {
      i++;
      if (i < tokens.length) {
        auth = { type: "basic", value: tokens[i] };
      }
    } else if (token.startsWith("-") && !token.startsWith("--")) {
      // Handle combined short flags like -sS, -k, -L, -v, -o, etc.
      // Some of these consume the next token as an argument
      const consumesArg = ["-o", "-O", "-e", "-A", "-b", "-c", "-D", "-K", "-m", "-w"];
      if (consumesArg.includes(token)) {
        i++; // skip the argument
      }
      // Otherwise just skip the flag (e.g. -s, -S, -k, -L, -v, -i)
    } else if (token.startsWith("--")) {
      // Long flags that consume the next token
      const consumesArg = [
        "--output", "--referer", "--user-agent", "--cookie", "--cookie-jar",
        "--dump-header", "--config", "--max-time", "--write-out", "--connect-timeout",
      ];
      if (consumesArg.includes(token)) {
        i++; // skip the argument
      }
      // Otherwise just skip the flag (e.g. --compressed, --silent, --insecure, --location)
    } else if (!token.startsWith("-")) {
      // Treat as URL
      url = token;
    }

    i++;
  }

  if (!url) {
    return { isValid: false, error: "No URL found in cURL command" };
  }

  // Infer method if not explicitly set
  if (!method) {
    method = body ? "POST" : "GET";
  }

  // If auth is basic and no Authorization header, add it conceptually
  // (we keep it in auth field, code generators will use it)

  return { isValid: true, method, url, headers, body, auth };
}

function indent({ code, level = 1 }: { code: string; level?: number }): string {
  const pad = "  ".repeat(level);
  return code
    .split("\n")
    .map((line) => (line.trim() ? pad + line : line))
    .join("\n");
}

function formatHeaders({ headers }: { headers: Record<string, string> }): string {
  const entries = Object.entries(headers);
  if (entries.length === 0) return "";
  const lines = entries.map(([k, v]) => `"${k}": "${v}"`);
  return lines.join(",\n");
}

export function toFetch({
  method,
  url,
  headers,
  body,
}: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}): string {
  const hasHeaders = Object.keys(headers).length > 0;
  const hasBody = body !== null;
  const needsOptions = method !== "GET" || hasHeaders || hasBody;

  if (!needsOptions) {
    return `const response = await fetch("${url}");\nconst data = await response.json();`;
  }

  let options = "";
  const parts: string[] = [];
  parts.push(`method: "${method}"`);

  if (hasHeaders) {
    const h = formatHeaders({ headers });
    parts.push(`headers: {\n${indent({ code: h })}\n}`);
  }

  if (hasBody) {
    // Try to detect if body is JSON
    let bodyStr: string;
    try {
      JSON.parse(body);
      bodyStr = `body: JSON.stringify(${body})`;
    } catch {
      bodyStr = `body: ${JSON.stringify(body)}`;
    }
    parts.push(bodyStr);
  }

  options = parts.map((p) => indent({ code: p })).join(",\n");

  return `const response = await fetch("${url}", {\n${options}\n});\nconst data = await response.json();`;
}

export function toAxios({
  method,
  url,
  headers,
  body,
}: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}): string {
  const lowerMethod = method.toLowerCase();
  const hasHeaders = Object.keys(headers).length > 0;
  const hasBody = body !== null;
  const hasDataMethods = ["post", "put", "patch"].includes(lowerMethod);

  if (!hasHeaders && !hasBody) {
    return `const { data } = await axios.${lowerMethod}("${url}");`;
  }

  const args: string[] = [`"${url}"`];

  if (hasDataMethods && hasBody) {
    let bodyArg: string;
    try {
      JSON.parse(body);
      bodyArg = body;
    } catch {
      bodyArg = JSON.stringify(body);
    }
    args.push(bodyArg);
  }

  if (hasHeaders || (hasBody && !hasDataMethods)) {
    const configParts: string[] = [];
    if (hasHeaders) {
      const h = formatHeaders({ headers });
      configParts.push(`headers: {\n${indent({ code: h, level: 2 })}\n  }`);
    }
    if (hasBody && !hasDataMethods) {
      let bodyVal: string;
      try {
        JSON.parse(body);
        bodyVal = body;
      } catch {
        bodyVal = JSON.stringify(body);
      }
      configParts.push(`data: ${bodyVal}`);
    }
    const config = configParts.map((p) => `  ${p}`).join(",\n");
    args.push(`{\n${config}\n}`);
  }

  return `const { data } = await axios.${lowerMethod}(\n${indent({ code: args.join(",\n") })}\n);`;
}

export function toReactQuery({
  method,
  url,
  headers,
  body,
}: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}): string {
  const isMutation = method !== "GET";
  const fetchCall = toFetch({ method, url, headers, body });

  if (!isMutation) {
    return [
      `const { data, isLoading, error } = useQuery({`,
      `  queryKey: ["${extractQueryKey({ url })}"],`,
      `  queryFn: async () => {`,
      indent({ code: fetchCall, level: 2 }),
      `    return data;`,
      `  },`,
      `});`,
    ].join("\n");
  }

  // For mutations, make body dynamic
  const mutationFetch = toFetch({
    method,
    url,
    headers,
    body: body ? "variables" : null,
  });

  return [
    `const { mutate, isPending, error } = useMutation({`,
    `  mutationFn: async (variables: unknown) => {`,
    indent({ code: mutationFetch, level: 2 }),
    `    return data;`,
    `  },`,
    `  onSuccess: (data) => {`,
    `    // Handle success`,
    `  },`,
    `});`,
  ].join("\n");
}

function extractQueryKey({ url }: { url: string }): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.join("-") || "data";
  } catch {
    return "data";
  }
}

export function highlightCode({ code }: { code: string }): string {
  const keywords = new Set(["const", "let", "var", "await", "async", "return", "import", "from", "export", "function", "true", "false", "null", "undefined"]);
  const apis = new Set(["useQuery", "useMutation", "axios", "fetch", "JSON", "response"]);

  const tokenRegex = /(\/\/.*$)|("(?:\\.|[^"\\])*")|('(?:\\.|[^'\\])*')|(\b\d+\.?\d*\b)|(\b[a-zA-Z_]\w*\b)|([^"'/\w]+)/gm;
  let result = "";
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(code)) !== null) {
    const [text] = match;
    const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    if (match[1]) {
      result += `<span style="color:#9ca3af">${safe}</span>`;
    } else if (match[2] || match[3]) {
      result += `<span style="color:#22c55e">${safe}</span>`;
    } else if (match[4]) {
      result += `<span style="color:#3b82f6">${safe}</span>`;
    } else if (match[5]) {
      if (keywords.has(text)) {
        result += `<span style="color:#a855f7">${safe}</span>`;
      } else if (apis.has(text)) {
        result += `<span style="color:#f59e0b">${safe}</span>`;
      } else {
        result += safe;
      }
    } else {
      result += safe;
    }
  }

  return result;
}
