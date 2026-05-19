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

export function calculateBMIFromHeightAndWeight(height, weightValue, weightUnit = 'kg') {
  const weight = Number(weightValue)
  const heightMatch = String(height || '').match(/^(\d+)'(\d+)$/)

  if (!heightMatch || !weight || weight <= 0) return null

  const totalInches = Number(heightMatch[1]) * 12 + Number(heightMatch[2])
  const heightM = totalInches * 0.0254
  const weightKg = String(weightUnit).toLowerCase() === 'lb' ? weight * 0.45359237 : weight

  return (weightKg / (heightM * heightM)).toFixed(1)
}
