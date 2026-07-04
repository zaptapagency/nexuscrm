import { describe, it, expect } from "vitest";
import { can, isAdmin, canDelete, canManageUsers, assertPermission, ForbiddenError } from "./rbac";

describe("rbac.can", () => {
  it("grants admin everything", () => {
    expect(can("ADMIN", "user:manage")).toBe(true);
    expect(can("ADMIN", "record:delete")).toBe(true);
    expect(can("ADMIN", "campaign:send")).toBe(true);
  });

  it("lets managers delete records but not manage users", () => {
    expect(can("MANAGER", "record:delete")).toBe(true);
    expect(can("MANAGER", "user:manage")).toBe(false);
  });

  it("blocks reps from deletes and user management", () => {
    expect(can("REP", "record:delete")).toBe(false);
    expect(can("REP", "user:manage")).toBe(false);
    expect(can("REP", "record:create")).toBe(true);
    expect(can("REP", "record:edit")).toBe(true);
  });

  it("returns false for unknown or missing roles", () => {
    expect(can(undefined, "record:create")).toBe(false);
    expect(can(null, "record:create")).toBe(false);
    expect(can("SUPERUSER", "record:create")).toBe(false);
  });
});

describe("rbac helpers", () => {
  it("isAdmin", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("MANAGER")).toBe(false);
  });
  it("canDelete", () => {
    expect(canDelete("MANAGER")).toBe(true);
    expect(canDelete("REP")).toBe(false);
  });
  it("canManageUsers", () => {
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canManageUsers("MANAGER")).toBe(false);
  });
});

describe("assertPermission", () => {
  it("throws ForbiddenError when not permitted", () => {
    expect(() => assertPermission("REP", "record:delete")).toThrow(ForbiddenError);
  });
  it("does not throw when permitted", () => {
    expect(() => assertPermission("ADMIN", "record:delete")).not.toThrow();
  });
});
