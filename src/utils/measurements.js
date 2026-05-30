export const HEIGHT_OPTIONS = Array.from({ length: 37 }, (_, i) => {
  const totalInches = 48 + i
  const feet = Math.floor(totalInches / 12)
  const inches = totalInches % 12
  return `${feet}'${inches}`
})

export const WEIGHT_UNIT_OPTIONS = ['kg', 'lb']

export function parseWeight(weight) {
  const raw = String(weight || '').trim().toLowerCase()
  if (!raw) {
    return { value: '', unit: 'kg' }
  }

  const match = raw.match(/^(\d+(?:\.\d+)?)\s*(kg|lb)?$/i)
  if (!match) {
    return { value: String(weight || '').trim(), unit: 'kg' }
  }

  return {
    value: match[1],
    unit: (match[2] || 'kg').toLowerCase(),
  }
}

export function formatWeight(value, unit = 'kg') {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) return ''
  return `${normalizedValue}${unit}`
}

export function calculateAgeFromBirthDate(birthDate) {
  if (!birthDate) return null

  const today = new Date()
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  let years = today.getFullYear() - birth.getFullYear()
  const monthDelta = today.getMonth() - birth.getMonth()

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    years -= 1
  }

  return years >= 0 ? years : null
}

export function calculateBMIFromHeightAndWeight(height, weightValue, weightUnit = 'kg') {
  const weight = Number(weightValue)
  const heightMatch = String(height || '').match(/^(\d+)'(\d+)$/)

  if (!heightMatch || !weight || weight <= 0) return null

  const totalInches = Number(heightMatch[1]) * 12 + Number(heightMatch[2])
  const heightM = totalInches * 0.0254
  const weightKg = String(weightUnit).toLowerCase() === 'lb' ? weight * 0.45359237 : weight

  return (weightKg / (heightM * heightM)).toFixed(1)
}

export function getBMIBadge({ bmi }) {
  const numericBMI = Number.parseFloat(bmi)
  if (Number.isNaN(numericBMI)) return null

  if (numericBMI < 18.5) return { label: 'Underweight', color: '#3b82f6' }
  if (numericBMI < 25) return { label: 'Normal', color: '#16a34a' }
  if (numericBMI < 30) return { label: 'Overweight', color: '#f59e0b' }
  return { label: 'Obese', color: '#ef4444' }
}
