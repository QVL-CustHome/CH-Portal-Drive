import type { Me } from "../api/auth";

export const DRIVE_ROLE = "drive";
export const DRIVE_ADMIN_ROLE = "drive_admin";

export function isPortalDrive(me: Me): boolean {
  return me.roles?.includes(DRIVE_ROLE) ?? false;
}

export function isDriveAdmin(me: Me): boolean {
  return me.roles?.includes(DRIVE_ADMIN_ROLE) ?? false;
}
