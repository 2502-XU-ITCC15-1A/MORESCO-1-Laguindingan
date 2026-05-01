import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { SAMPLE_PATIENTS, SAMPLE_RECORDS } from '../src/data/patients.js'

const prisma = new PrismaClient()

const USERS = [
  { username: 'andrei.valdez', password: 'moresco2024', role: 'CEO of Nursing' },
  { username: 'admin', password: 'admin123', role: 'Administrator' },
  { username: 'nurse1', password: 'nurse123', role: 'Staff Nurse' },
]

const DISEASES = [
  { name: 'Cough', aliases: ['Ubo'] },
  { name: 'Fever', aliases: ['Lagnat'] },
  { name: 'Hypertension', aliases: ['High blood pressure'] },
  { name: 'Asthma', aliases: [] },
  { name: 'Migraine', aliases: [] },
  { name: 'Viral Syndrome', aliases: [] },
]

function toBloodEnum(value) {
  const map = {
    'A+': 'A_PLUS',
    'A-': 'A_MINUS',
    'B+': 'B_PLUS',
    'B-': 'B_MINUS',
    'AB+': 'AB_PLUS',
    'AB-': 'AB_MINUS',
    'O+': 'O_PLUS',
    'O-': 'O_MINUS',
  }
  return map[value] || 'UNKNOWN'
}

async function main() {
  console.log('Starting database seeding...')

  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10)
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash,
        role: user.role,
      },
      create: {
        username: user.username,
        passwordHash,
        role: user.role,
      },
    })
    console.log(`Created user: ${user.username}`)
  }

  for (const disease of DISEASES) {
    await prisma.disease.upsert({
      where: { name: disease.name },
      update: { aliases: disease.aliases, active: true },
      create: disease,
    })
  }
  console.log('Seeded disease dictionary.')

  const patientCount = await prisma.patient.count()
  if (patientCount > 0) {
    console.log('Patients already exist. Skipping sample patient seed.')
    return
  }

  for (const [index, patient] of SAMPLE_PATIENTS.entries()) {
    const created = await prisma.patient.create({
      data: {
        firstName: patient.firstName,
        middleName: patient.middleName || null,
        lastName: patient.lastName,
        idNumber: patient.idNumber,
        birthDate: new Date(patient.birthDate),
        position: patient.position,
        status: patient.status,
        sex: patient.sex,
        height: patient.height || '',
        weight: patient.weight || '',
        permAddress: patient.permAddress || '',
        presAddress: patient.presAddress || '',
        bloodType: toBloodEnum(patient.bloodType),
        allergies: {
          create: (patient.allergies || []).map(allergyName => ({ allergyName })),
        },
        chronicConditions: {
          create: (patient.chronicConditions || []).map(conditionName => ({ conditionName })),
        },
      },
    })

    if (index === 0) {
      for (const record of SAMPLE_RECORDS) {
        await prisma.healthRecord.create({
          data: {
            patientId: created.id,
            recordDate: new Date(record.date),
            bpVal: record.bpVal,
            o2Val: record.o2Val,
            hrVal: record.hrVal,
            tempVal: record.tempVal,
            complaints: record.complaints,
            diagnosis: record.diagnosis,
            remarks: record.remarks,
            photoUrl: record.photoUrl,
          },
        })
      }
    }

    console.log(`Created patient: ${created.firstName} ${created.lastName}`)
  }

  console.log('Database seeding completed.')
}

main()
  .catch((error) => {
    console.error('Seeding failed:')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
