export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase()
}

export function isHrAdmin(role) {
  return normalizeRole(role) === 'hr admin'
}

export function isCompanyNurse(role) {
  return normalizeRole(role) === 'company nurse'
}

export function roleLabel(role) {
  return isHrAdmin(role) ? 'HR Admin' : isCompanyNurse(role) ? 'Company Nurse' : role || 'Company Nurse'
}
