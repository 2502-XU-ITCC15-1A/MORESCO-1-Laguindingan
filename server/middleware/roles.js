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

export function canEditPatientPersonal(req) {
  return isHrAdmin(req) || isCompanyNurse(req)
}

export function canViewDiseaseStats(req) {
  return isHrAdmin(req) || isCompanyNurse(req)
}

export function requireCompanyNurse(req, res, next) {
  if (!isCompanyNurse(req)) {
    return res.status(403).json({ message: 'Company Nurse access required' })
  }
  next()
}

export function requirePatientPersonalEditor(req, res, next) {
  if (!canEditPatientPersonal(req)) {
    return res.status(403).json({ message: 'Personal information access required' })
  }
  next()
}

export function requireDiseaseStatsViewer(req, res, next) {
  if (!canViewDiseaseStats(req)) {
    return res.status(403).json({ message: 'Disease statistics access required' })
  }
  next()
}

export function requireDiseaseManager(req, res, next) {
  if (!isHrAdmin(req) && !isCompanyNurse(req)) {
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
