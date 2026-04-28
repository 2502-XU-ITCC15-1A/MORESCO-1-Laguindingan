import { useState } from 'react'
import './Health.css'

const BLOOD_TYPES = ['Unknown','A+','A-','B+','B-','AB+','AB-','O+','O-']

function TagList({ items, onAdd, onRemove, placeholder, editMode }) {
  const [input, setInput] = useState('')

  function handleAdd() {
    const val = input.trim()
    if (val && !items.includes(val)) {
      onAdd(val)
      setInput('')
    }
  }

  return (
    <div className="health-tag-list">
      <div className="health-tag-items">
        {items.length === 0
          ? <span className="health-tag-empty">None recorded</span>
          : items.map(item => (
            <span key={item} className="health-tag">
              {item}
              {editMode && (
                <button className="health-tag-remove" onClick={() => onRemove(item)}>×</button>
              )}
            </span>
          ))
        }
      </div>
      {editMode && (
        <div className="health-tag-input-row">
          <input
            className="health-tag-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder={placeholder}
          />
          <button className="health-tag-add" onClick={handleAdd}>Add</button>
        </div>
      )}
    </div>
  )
}

function Health({ healthData, onUpdate }) {
  const [editMode, setEditMode]   = useState(false)
  const [allergies, setAllergies] = useState(healthData?.allergies         || [])
  const [conditions, setConditions] = useState(healthData?.chronicConditions || [])
  const [bloodType, setBloodType] = useState(healthData?.bloodType          || 'Unknown')

  function handleSave() {
    if (onUpdate) onUpdate({ allergies, chronicConditions: conditions, bloodType })
    setEditMode(false)
  }

  function handleCancel() {
    setAllergies(healthData?.allergies         || [])
    setConditions(healthData?.chronicConditions || [])
    setBloodType(healthData?.bloodType          || 'Unknown')
    setEditMode(false)
  }

  return (
    <div className="health-container">
      <div className="health-section">

        {/* Section header with edit/save */}
        <div className="health-section-header">
          <h4 className="health-section-title">Health Information</h4>
          <div className="health-header-btns">
            {editMode ? (
              <>
                <button className="health-cancel-btn" onClick={handleCancel}>Cancel</button>
                <button className="health-save-btn" onClick={handleSave}>Save</button>
              </>
            ) : (
              <button className="health-edit-btn" onClick={() => setEditMode(true)}>Edit</button>
            )}
          </div>
        </div>

        {/* Blood Type */}
        <div className="health-field">
          <label className="health-field-label">Blood Type</label>
          {editMode
            ? (
              <select
                className="health-blood-select"
                value={bloodType}
                onChange={e => setBloodType(e.target.value)}
              >
                {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )
            : (
              <div className="health-tag-items">
                <span className={`health-blood-badge ${bloodType !== 'Unknown' ? 'known' : ''}`}>
                  {bloodType}
                </span>
              </div>
            )
          }
        </div>

        {/* Allergies */}
        <div className="health-field">
          <label className="health-field-label">Allergies</label>
          <TagList
            items={allergies}
            onAdd={val => setAllergies(a => [...a, val])}
            onRemove={val => setAllergies(a => a.filter(x => x !== val))}
            placeholder="Type allergy, press Enter or Add"
            editMode={editMode}
          />
        </div>

        {/* Chronic Conditions */}
        <div className="health-field">
          <label className="health-field-label">Chronic Conditions</label>
          <TagList
            items={conditions}
            onAdd={val => setConditions(c => [...c, val])}
            onRemove={val => setConditions(c => c.filter(x => x !== val))}
            placeholder="Type condition, press Enter or Add"
            editMode={editMode}
          />
        </div>

      </div>
    </div>
  )
}

export default Health
