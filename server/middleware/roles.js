function normalizedRole(req) {
  return String(req.user?.role || '').trim().toLowerCase()
}

export function isHrAdmin(req) {
  return normalizedRole(req) === 'hr admin'
}

export function isCompanyNurse(req) {
  return normalizedRole(req) === 'company nurse'
}

export function requireHrAdmin(req, res, next) {
  if (!isHrAdmin(req)) {
    return res.status(403).json({ message: 'HR Admin access required' })
  }
  next()
}

export function requireCompanyNurse(req, res, next) {
  if (!isCompanyNurse(req)) {
    return res.status(403).json({ message: 'Company Nurse access required' })
  }
  next()
}
