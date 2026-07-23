import type { PermissionAction, PermissionResource, UserProfile } from '@/types/permissions'

export function hasPermission(
  profile: UserProfile | null,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  if (!profile) return false
  if (profile.is_super_admin) return true
  if (!Array.isArray(profile.permissions)) return false
  return profile.permissions.some(p => p.resource === resource && p.action === action)
}

export function hasAllPermissions(
  profile: UserProfile | null,
  checks: Array<{ resource: PermissionResource; action: PermissionAction }>
): boolean {
  return checks.every(({ resource, action }) => hasPermission(profile, resource, action))
}