import { describe, it, expect } from "bun:test";
import { decodeJwt, getExpiry, getAlgorithm } from "./jwt.utils";

// A real HS256 JWT with payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
const VALID_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

// Token with exp in the past (exp: 1000000000 = 2001-09-09)
const EXPIRED_TOKEN_PAYLOAD = {
  sub: "1234567890",
  name: "Test",
  exp: 1000000000,
};

// Token with exp far in the future (exp: 9999999999 = 2286-11-20)
const FUTURE_TOKEN_PAYLOAD = {
  sub: "1234567890",
  name: "Test",
  exp: 9999999999,
};

describe("decodeJwt", () => {
  it("decodes a valid JWT into header, payload, and signature", () => {
    const result = decodeJwt({ token: VALID_TOKEN });
    expect(result.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(result.payload).toEqual({
      sub: "1234567890",
      name: "John Doe",
      iat: 1516239022,
    });
    expect(result.signature).toBe("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
  });

  it("extracts header fields correctly", () => {
    const { header } = decodeJwt({ token: VALID_TOKEN });
    expect(header.alg).toBe("HS256");
    expect(header.typ).toBe("JWT");
  });

  it("extracts payload fields correctly", () => {
    const { payload } = decodeJwt({ token: VALID_TOKEN });
    expect(payload.sub).toBe("1234567890");
    expect(payload.name).toBe("John Doe");
    expect(payload.iat).toBe(1516239022);
  });

  it("trims whitespace from token", () => {
    const result = decodeJwt({ token: `  ${VALID_TOKEN}  ` });
    expect(result.header.alg).toBe("HS256");
  });

  it("throws for token with fewer than 3 parts", () => {
    expect(() => decodeJwt({ token: "part1.part2" })).toThrow(
      "Invalid JWT: expected 3 parts separated by dots"
    );
  });

  it("throws for token with more than 3 parts", () => {
    expect(() => decodeJwt({ token: "a.b.c.d" })).toThrow(
      "Invalid JWT: expected 3 parts separated by dots"
    );
  });

  it("throws for empty string", () => {
    expect(() => decodeJwt({ token: "" })).toThrow();
  });

  it("throws for invalid base64 in header", () => {
    expect(() => decodeJwt({ token: "!!!.eyJ0ZXN0IjoxfQ.sig" })).toThrow();
  });
});

describe("getExpiry", () => {
  it("detects an expired token", () => {
    const result = getExpiry({ payload: EXPIRED_TOKEN_PAYLOAD });
    expect(result.isExpired).toBe(true);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.timeRemaining).toContain("expired");
    expect(result.timeRemaining).toContain("ago");
  });

  it("detects a future expiry", () => {
    const result = getExpiry({ payload: FUTURE_TOKEN_PAYLOAD });
    expect(result.isExpired).toBe(false);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.timeRemaining).toContain("expires in");
  });

  it("returns null expiresAt when no exp claim exists", () => {
    const result = getExpiry({ payload: { sub: "123" } });
    expect(result.expiresAt).toBeNull();
    expect(result.isExpired).toBe(false);
    expect(result.timeRemaining).toBe("No expiry set");
  });

  it("returns null expiresAt when exp is not a number", () => {
    const result = getExpiry({ payload: { exp: "not-a-number" } });
    expect(result.expiresAt).toBeNull();
    expect(result.timeRemaining).toBe("No expiry set");
  });

  it("converts exp from seconds to correct Date", () => {
    const result = getExpiry({ payload: { exp: 1000000000 } });
    expect(result.expiresAt!.getTime()).toBe(1000000000 * 1000);
  });
});

describe("getAlgorithm", () => {
  it("returns the algorithm from header", () => {
    expect(getAlgorithm({ header: { alg: "HS256" } })).toBe("HS256");
    expect(getAlgorithm({ header: { alg: "RS256" } })).toBe("RS256");
    expect(getAlgorithm({ header: { alg: "ES384" } })).toBe("ES384");
  });

  it("returns 'unknown' when alg is missing", () => {
    expect(getAlgorithm({ header: {} })).toBe("unknown");
  });

  it("returns 'unknown' when alg is not a string", () => {
    expect(getAlgorithm({ header: { alg: 123 } })).toBe("unknown");
  });
});
