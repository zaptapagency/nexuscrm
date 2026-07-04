import type { Role } from "./constants";

/**
 * Permission model for NexusCRM.
 * - ADMIN: full access, including user management and deletes
 * - MANAGER: manage all records, delete records, but not user management
 * - REP: create/edit records, but cannot delete records or manage users
 */
export type Permission =
  | "record:create"
  | "record:edit"
  | "record:delete"
  | "user:manage"
  | "settings:manage"
  | "campaign:send"
  | "form:manage";

const MATRIX: Record<Role, Permission[]> = {
  ADMIN: [
    "record:create",
    "record:edit",
    "record:delete",
    "user:manage",
    "settings:manage",
    "campaign:send",
    "form:manage",
  ],
  MANAGER: [
    "record:create",
    "record:edit",
    "record:delete",
    "settings:manage",
    "campaign:send",
    "form:manage",
  ],
  REP: ["record:create", "record:edit", "campaign:send", "form:manage"],
};

export function can(role: Role | string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const perms = MATRIX[role as Role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function isAdmin(role: Role | string | undefined | null): boolean {
  return role === "ADMIN";
}

export function canManageUsers(role: Role | string | undefined | null): boolean {
  return can(role, "user:manage");
}

export function canDelete(role: Role | string | undefined | null): boolean {
  return can(role, "record:delete");
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertPermission(role: Role | string | undefined | null, permission: Permission) {
  if (!can(role, permission)) {
    throw new ForbiddenError();
  }
}
