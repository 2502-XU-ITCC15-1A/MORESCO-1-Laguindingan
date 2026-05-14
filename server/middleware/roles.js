function normalizedRole(req) {
  return String(req.user?.role || '').trim().toLowerCase()
}

export function isHrAdmin(req) {
  return normalizedRole(req) === 'hr admin'
}

export function isCompanyNurse(req) {
  return normalizedRole(req) === 'company nurse'
}

export function isItManager(req) {
  return normalizedRole(req) === 'it manager'
}

export function canManageClinicalData(req) {
  return isCompanyNurse(req) || isItManager(req)
}

export function requireHrAdmin(req, res, next) {
  if (!isHrAdmin(req)) {
    return res.status(403).json({ message: 'HR Admin access required' })
  }
  next()
}

export function requireCompanyNurse(req, res, next) {
  if (!canManageClinicalData(req)) {
    return res.status(403).json({ message: 'Company Nurse or IT Manager access required' })
  }
  next()
}

export function requireOnlyCompanyNurse(req, res, next) {
  if (!isCompanyNurse(req)) {
    return res.status(403).json({ message: 'Company Nurse access required' })
  }
  next()
}

export function requireDiseaseManager(req, res, next) {
  if (!isHrAdmin(req) && !isCompanyNurse(req) && !isItManager(req)) {
    return res.status(403).json({ message: 'Disease management access required' })
  }
  next()
}

export function requireItManager(req, res, next) {
  if (!isItManager(req)) {
    return res.status(403).json({ message: 'IT Manager access required' })
  }
  next()
}
