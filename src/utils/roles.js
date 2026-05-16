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

export function canAccessPatients(role) {
  return isHrAdmin(role) || isCompanyNurse(role)
}

export function canManagePatients(role) {
  return isCompanyNurse(role)
}

export function canEditPatientPersonal(role) {
  return isHrAdmin(role) || isCompanyNurse(role)
}

export function canEditPatientMeasurements(role) {
  return isCompanyNurse(role)
}

export function canEditPatientHealth(role) {
  return isCompanyNurse(role)
}

export function canManagePatientRecords(role) {
  return isCompanyNurse(role)
}

export function canManageDiseases(role) {
  return isHrAdmin(role) || isCompanyNurse(role)
}

export function canViewDiseaseStats(role) {
  return isCompanyNurse(role)
}

export function canManageUserAccess(role) {
  return isItManager(role)
}

export function getDefaultRoute(role) {
  if (canManageUserAccess(role)) return '/user-access'
  if (canAccessPatients(role)) return '/patients'
  return '/login'
}

export function roleLabel(role) {
  if (isHrAdmin(role)) return 'HR Admin'
  if (isCompanyNurse(role)) return 'Company Nurse'
  if (isItManager(role)) return 'IT Manager'
  return role || 'Company Nurse'
}
