import { describe, expect, it } from "vitest";
import {
  isExpired,
  isOpenPath,
  isStaff,
  safeNextPath,
  sessionFromAccessToken,
  type AccessSession,
} from "./tokens";

function jwt(claims: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "RS256" })}.${encode(claims)}.signature`;
}

describe("safeNextPath", () => {
  it("keeps paths inside the internal area, with their query", () => {
    expect(safeNextPath("/noi-bo")).toBe("/noi-bo");
    expect(safeNextPath("/noi-bo/bao-gia/123?tab=file")).toBe("/noi-bo/bao-gia/123?tab=file");
  });

  it("falls back to the dashboard for anything that could leave the site", () => {
    for (const value of [
      null,
      "",
      "https://evil.example/noi-bo",
      "//evil.example/noi-bo",
      "/\\evil.example",
      "/noi-bo\\..\\evil",
      "noi-bo",
      "/san-pham",
      "/noi-bo-gia/x",
      "/noi-bo/../san-pham",
      "/noi-bo\n/x",
    ]) {
      expect(safeNextPath(value)).toBe("/noi-bo");
    }
  });

  it("never returns to the login or sign-out endpoints", () => {
    expect(safeNextPath("/noi-bo/dang-nhap?next=/noi-bo")).toBe("/noi-bo");
    expect(safeNextPath("/noi-bo/auth/dang-xuat")).toBe("/noi-bo");
    expect(safeNextPath("/noi-bo/khong-co-quyen")).toBe("/noi-bo");
  });
});

describe("sessionFromAccessToken", () => {
  it("reads the user, the platform roles and the expiry", () => {
    const session = sessionFromAccessToken(
      jwt({
        sub: "u-1",
        preferred_username: "staff",
        name: "Nguyễn Thị Linh",
        email: "linh@kimlong.local",
        exp: 1_800_000_000,
        realm_access: { roles: ["offline_access", "STAFF", "CUSTOMER", "uma_authorization"] },
      }),
    );
    expect(session?.user).toEqual({
      id: "u-1",
      username: "staff",
      name: "Nguyễn Thị Linh",
      email: "linh@kimlong.local",
      roles: ["STAFF", "CUSTOMER"],
    });
    expect(session?.expiresAt).toBe(1_800_000_000);
  });

  it("falls back to the username when the token has no name, and to no roles", () => {
    const session = sessionFromAccessToken(jwt({ sub: "u-2", preferred_username: "an", exp: 10 }));
    expect(session?.user.name).toBe("an");
    expect(session?.user.roles).toEqual([]);
  });

  it("rejects tokens that are not a JWT with a subject and an expiry", () => {
    expect(sessionFromAccessToken("opaque-token")).toBeNull();
    expect(sessionFromAccessToken("a.%%%.c")).toBeNull();
    expect(sessionFromAccessToken(jwt({ preferred_username: "an", exp: 10 }))).toBeNull();
    expect(sessionFromAccessToken(jwt({ sub: "u-3" }))).toBeNull();
  });
});

describe("roles and expiry", () => {
  it("lets staff and administrators in, and nobody else", () => {
    expect(isStaff(["STAFF"])).toBe(true);
    expect(isStaff(["ADMIN", "CUSTOMER"])).toBe(true);
    expect(isStaff(["CUSTOMER"])).toBe(false);
    expect(isStaff([])).toBe(false);
  });

  it("treats a token inside the leeway as already expired", () => {
    const session = { expiresAt: 1000 } as AccessSession;
    expect(isExpired(session, 900)).toBe(false);
    expect(isExpired(session, 1000)).toBe(true);
    expect(isExpired(session, 950, 60)).toBe(true);
    expect(isExpired(session, 930, 60)).toBe(false);
  });

  it("opens only the login, callback and sign-out endpoints without a session", () => {
    expect(isOpenPath("/noi-bo/dang-nhap")).toBe(true);
    expect(isOpenPath("/noi-bo/auth/callback")).toBe(true);
    expect(isOpenPath("/noi-bo")).toBe(false);
    expect(isOpenPath("/noi-bo/auth/phien")).toBe(false);
    expect(isOpenPath("/noi-bo/khach-hang")).toBe(false);
  });
});
