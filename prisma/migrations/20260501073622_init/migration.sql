-- CreateEnum
CREATE TYPE "blood_type_enum" AS ENUM ('A_PLUS', 'A_MINUS', 'B_PLUS', 'B_MINUS', 'AB_PLUS', 'AB_MINUS', 'O_PLUS', 'O_MINUS', 'UNKNOWN');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "height" TEXT,
    "weight" TEXT,
    "perm_address" TEXT,
    "pres_address" TEXT,
    "photo_url" TEXT,
    "blood_type" "blood_type_enum" DEFAULT 'UNKNOWN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_records" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "record_date" TIMESTAMP(3) NOT NULL,
    "bp_val" TEXT,
    "o2_val" TEXT,
    "hr_val" TEXT,
    "temp_val" TEXT,
    "complaints" TEXT,
    "diagnosis" TEXT,
    "remarks" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergies" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "allergy_name" TEXT NOT NULL,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronic_conditions" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "condition_name" TEXT NOT NULL,

    CONSTRAINT "chronic_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "patients_id_number_key" ON "patients"("id_number");

-- AddForeignKey
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronic_conditions" ADD CONSTRAINT "chronic_conditions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
