export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase()
}

export function isHrAdmin(role) {
  return normalizeRole(role) === 'hr admin'
}

export function isCompanyNurse(role) {
  return normalizeRole(role) === 'company nurse'
}

export function isItManager(role) {
  return normalizeRole(role) === 'it manager'
}

export function canManagePatients(role) {
  return isCompanyNurse(role) || isItManager(role)
}

export function canManageDiseases(role) {
  return isHrAdmin(role) || isCompanyNurse(role) || isItManager(role)
}

export function canManageUserAccess(role) {
  return isItManager(role)
}

export function roleLabel(role) {
  if (isHrAdmin(role)) return 'HR Admin'
  if (isCompanyNurse(role)) return 'Company Nurse'
  if (isItManager(role)) return 'IT Manager'
  return role || 'Company Nurse'
}
