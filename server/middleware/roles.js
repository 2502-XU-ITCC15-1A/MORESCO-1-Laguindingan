export function requireAdmin(req, res, next) {
  const role = String(req.user?.role || '').toLowerCase()
  if (!role.includes('admin')) {
    return res.status(403).json({ message: 'Administrator access required' })
  }
  next()
}
