export type PermissionResource =
  | 'dashboard'
  | 'shifts'
  | 'qm_checklists'
  | 'wiki'
  | 'orders'
  | 'onboarding'
  | 'documents'
  | 'contacts'
  | 'requests'
  | 'patient_intake'
  | 'user_management'
  | 'role_management'

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'

export interface Permission {
  resource: PermissionResource
  action: PermissionAction
}

export interface UserProfile {
  id: string
  full_name: string
  initials: string
  avatar_url: string | null
  role_id: string | null
  role: {
    id: string
    name: string
    slug: string
    color: string | null
  } | null
  permissions: Permission[]
  is_super_admin: boolean
}