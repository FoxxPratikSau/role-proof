const PAGE_PERMISSIONS = {
  workspace: ["user", "admin"],
  administration: ["admin"],
} as const;

export type PagePermission = keyof typeof PAGE_PERMISSIONS;

export const canAccessPage = (
  permission: PagePermission,
  role: string,
): boolean => {
  return (PAGE_PERMISSIONS[permission] as readonly string[]).includes(role);
};
