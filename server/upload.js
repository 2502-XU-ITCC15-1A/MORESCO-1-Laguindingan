import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import multer from 'multer'

function storageFor(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const datePath = new Date().toISOString().slice(0, 10)
      const dir = path.join(process.cwd(), 'uploads', folder, datePath)
      fs.mkdirSync(dir, { recursive: true })
      req.uploadSubdir = `${folder}/${datePath}`
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg'
      const safeBaseName = path.basename(file.originalname || 'image', ext)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || folder
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
      const filename = `${safeBaseName}-${uniqueSuffix}${ext}`
      req.savedFileUrl = `/uploads/${req.uploadSubdir}/${filename}`
      cb(null, filename)
    },
  })
}

export function imageUpload(folder) {
  return multer({
    storage: storageFor(folder),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true)
      else cb(new Error('Only image files are allowed'))
    },
  })
}
