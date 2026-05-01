import { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { diseasesAPI } from '../../../api/client.js'
import './DiseaseManager.css'

function DiseaseManager({ show, onClose }) {
  const [diseases, setDiseases] = useState([])
  const [name, setName] = useState('')
  const [aliases, setAliases] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!show) return
    diseasesAPI.getAll()
      .then(setDiseases)
      .catch(err => setError(err.message || 'Unable to load diseases.'))
  }, [show])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    try {
      const created = await diseasesAPI.create({
        name,
        aliases: aliases.split(',').map(alias => alias.trim()).filter(Boolean),
      })
      setDiseases(prev => [...prev.filter(item => item.id !== created.id), created].sort((a, b) => a.name.localeCompare(b.name)))
      setName('')
      setAliases('')
    } catch (err) {
      setError(err.message || 'Unable to save disease.')
    }
  }

  async function handleDelete(id) {
    await diseasesAPI.delete(id)
    setDiseases(prev => prev.filter(item => item.id !== id))
  }

  return (
    <Modal show={show} onHide={onClose} centered contentClassName="disease-modal">
      <Modal.Header className="disease-header">
        <h2>Disease Dictionary</h2>
      </Modal.Header>
      <Modal.Body className="disease-body">
        <form className="disease-form" onSubmit={handleAdd}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Disease name, e.g. Cough" />
          <input value={aliases} onChange={e => setAliases(e.target.value)} placeholder="Aliases, e.g. Ubo" />
          <button type="submit">Add</button>
        </form>
        {error && <p className="disease-error">{error}</p>}
        <div className="disease-list">
          {diseases.map(disease => (
            <div className="disease-item" key={disease.id}>
              <div>
                <strong>{disease.name}</strong>
                <span>{disease.aliases?.length ? disease.aliases.join(', ') : 'No aliases'}</span>
              </div>
              <button onClick={() => handleDelete(disease.id)}>Delete</button>
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default DiseaseManager
