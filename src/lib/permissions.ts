export type UserRole = "admin" | "editor" | "viewer" | "visitor";

export interface Permissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canViewQuotations: boolean;
}

export function getPermissions(role: string | undefined): Permissions {
  switch (role) {
    case "admin":
      return { canView: true, canEdit: true, canDelete: true, canManageUsers: true, canViewQuotations: true };
    case "editor":
      return { canView: true, canEdit: true, canDelete: false, canManageUsers: false, canViewQuotations: true };
    case "viewer":
      return { canView: true, canEdit: false, canDelete: false, canManageUsers: false, canViewQuotations: true };
    case "visitor":
      return { canView: true, canEdit: false, canDelete: false, canManageUsers: false, canViewQuotations: false };
    default:
      return { canView: true, canEdit: false, canDelete: false, canManageUsers: false, canViewQuotations: false };
  }
}
