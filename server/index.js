import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { initDb } from './db-init.js'
import { createRateLimiter } from './middleware/rateLimit.js'
import authRoutes from './routes/auth.js'
import patientRoutes from './routes/patients.js'
import recordRoutes from './routes/records.js'
import diseaseRoutes from './routes/diseases.js'
import accessRoutes from './routes/access.js'

const app = express()
const port = process.env.PORT || 5000
const apiRateLimiter = createRateLimiter({
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000),
  maxRequests: Number(process.env.API_RATE_LIMIT_MAX || 300),
  message: 'Too many API requests. Please slow down and try again shortly.',
})

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',').map(o => o.trim());

function isAllowedOrigin(origin) {
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === '*') return true
    if (allowedOrigin === origin) return true

    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
      return new RegExp(`^${pattern}$`).test(origin)
    }

    return false
  })
}

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/api', corsMiddleware)
app.use('/api', apiRateLimiter)
app.use('/api/auth', authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/records', recordRoutes)
app.use('/api/diseases', diseaseRoutes)
app.use('/api/access', accessRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Moresco-1 API is running' })
})

const distPath = path.join(process.cwd(), 'dist')
if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'Moresco-1 API',
      status: 'running',
      endpoints: {
        health: 'GET /api/health',
        login: 'POST /api/auth/login',
        patients: 'GET /api/patients',
        records: 'GET /api/records/:patientId',
      },
    })
  })
}

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Moresco-1 backend running on http://localhost:${port}`)
    })
  })
  .catch(error => {
    console.error('Failed to initialize database schema:', error)
    process.exit(1)
  })
