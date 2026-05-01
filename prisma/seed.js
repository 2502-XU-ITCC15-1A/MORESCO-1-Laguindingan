import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { SAMPLE_PATIENTS } from '../src/data/patients.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data (in correct order to avoid foreign key conflicts)
  await prisma.healthRecord.deleteMany({});
  await prisma.allergy.deleteMany({});
  await prisma.chronicCondition.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create a test admin user (password: admin123)
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hashedPassword,
      role: 'Administrator',
    },
  });
  console.log(`✅ Created user: ${adminUser.username} (${adminUser.role})`);

  // 3. Seed patients from your frontend data
  for (const p of SAMPLE_PATIENTS) {
    // Map the string blood type to Prisma enum
    let bloodTypeEnum = 'UNKNOWN';
    if (p.bloodType) {
      const upper = p.bloodType.toUpperCase().replace('-', '_');
      if (['A_PLUS', 'A_MINUS', 'B_PLUS', 'B_MINUS', 'AB_PLUS', 'AB_MINUS', 'O_PLUS', 'O_MINUS'].includes(upper)) {
        bloodTypeEnum = upper;
      }
    }

    // Parse birthDate – handle format like "April 17, 2004"
    let birthDateObj = new Date(); // Default to now if parsing fails
    if (p.birthDate) {
      const parsed = new Date(p.birthDate);
      if (!isNaN(parsed)) {
        birthDateObj = parsed;
      } else {
        // Fallback: if a string like "YYYY-MM-DD" is provided
        birthDateObj = new Date(p.birthDate);
      }
    }

    const newPatient = await prisma.patient.create({
      data: {
        firstName: p.firstName,
        middleName: p.middleName || '',
        lastName: p.lastName,
        idNumber: p.idNumber,
        birthDate: birthDateObj,
        position: p.position,
        status: p.status,
        sex: p.sex,
        height: p.height || '',
        weight: p.weight || '',
        permAddress: p.permAddress || '',
        presAddress: p.presAddress || '',
        bloodType: bloodTypeEnum,
        allergies: {
          create: p.allergies.map((name) => ({ allergyName: name })),
        },
        chronicConditions: {
          create: p.chronicConditions.map((name) => ({ conditionName: name })),
        },
      },
    });
    console.log(`✅ Created patient: ${newPatient.firstName} ${newPatient.lastName} (ID: ${newPatient.idNumber})`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });