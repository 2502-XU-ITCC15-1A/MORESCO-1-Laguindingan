import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'

function storageFor(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), 'uploads', folder)
      fs.mkdirSync(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${folder}_${Date.now()}${ext}`)
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
