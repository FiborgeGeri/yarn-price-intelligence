export type UserRole = "admin" | "editor" | "viewer";

export interface Permissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}

export function getPermissions(role: string | undefined): Permissions {
  switch (role) {
    case "admin":
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canManageUsers: true,
      };
    case "editor":
      return {
        canView: true,
        canEdit: true,
        canDelete: false,
        canManageUsers: false,
      };
    case "viewer":
    default:
      return {
        canView: true,
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
      };
  }
}
