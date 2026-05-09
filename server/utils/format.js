const bloodToEnum = {
  'A+': 'A_PLUS',
  'A-': 'A_MINUS',
  'B+': 'B_PLUS',
  'B-': 'B_MINUS',
  'AB+': 'AB_PLUS',
  'AB-': 'AB_MINUS',
  'O+': 'O_PLUS',
  'O-': 'O_MINUS',
  Unknown: 'UNKNOWN',
  UNKNOWN: 'UNKNOWN',
}

const enumToBlood = {
  A_PLUS: 'A+',
  A_MINUS: 'A-',
  B_PLUS: 'B+',
  B_MINUS: 'B-',
  AB_PLUS: 'AB+',
  AB_MINUS: 'AB-',
  O_PLUS: 'O+',
  O_MINUS: 'O-',
  UNKNOWN: 'Unknown',
}

export function parseJsonArray(value) {
  if (Array.isArray(value)) return value
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function toBloodEnum(value) {
  return bloodToEnum[value] || bloodToEnum[String(value || '').toUpperCase()] || 'UNKNOWN'
}

export function fromBloodEnum(value) {
  return enumToBlood[value] || 'Unknown'
}

export function formatPatient(patient) {
  return {
    id: patient.id,
    idNumber: patient.idNumber,
    firstName: patient.firstName,
    middleName: patient.middleName || '',
    lastName: patient.lastName,
    birthDate: patient.birthDate ? patient.birthDate.toISOString().slice(0, 10) : '',
    position: patient.position,
    status: patient.status,
    sex: patient.sex,
    height: patient.height || '',
    weight: patient.weight || '',
    permAddress: patient.permAddress || '',
    presAddress: patient.presAddress || '',
    photoUrl: patient.photoUrl || '',
    photoPreview: patient.photoUrl || '',
    bloodType: fromBloodEnum(patient.bloodType),
    allergies: patient.allergies?.map(item => item.allergyName) || [],
    chronicConditions: patient.chronicConditions?.map(item => item.conditionName) || [],
  }
}

export function formatRecord(record) {
  return {
    id: record.id,
    patientId: record.patientId,
    date: record.recordDate ? record.recordDate.toISOString().slice(0, 10).replaceAll('-', '/') : '',
    recordDate: record.recordDate ? record.recordDate.toISOString().slice(0, 10) : '',
    bpVal: record.bpVal || '',
    o2Val: record.o2Val || '',
    hrVal: record.hrVal || '',
    tempVal: record.tempVal || '',
    complaints: record.complaints || '',
    diagnosis: record.diagnosis || '',
    remarks: record.remarks || '',
    photoUrl: record.photoUrl || '',
  }
}
