import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import authRoutes from './routes/auth.js'
import patientRoutes from './routes/patients.js'
import recordRoutes from './routes/records.js'
import diseaseRoutes from './routes/diseases.js'

const app = express()
const port = process.env.PORT || 5000

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/records', recordRoutes)
app.use('/api/diseases', diseaseRoutes)

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

app.listen(port, () => {
  console.log(`Moresco-1 backend running on http://localhost:${port}`)
})
