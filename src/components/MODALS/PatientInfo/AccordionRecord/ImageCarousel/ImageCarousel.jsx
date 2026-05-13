import { useMemo, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import MobileStepper from '@mui/material/MobileStepper'
import './ImageCarousel.css'

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function ImageCarousel({
  images = [],
  recordDate,
  editMode = false,
  pendingUploadsCount = 0,
  onChangePhotoClick,
  onRemoveImage,
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  const safeImages = useMemo(
    () => images
      .map(image => (typeof image === 'string' ? { id: image, photoUrl: image, persisted: true } : image))
      .filter(image => image?.photoUrl),
    [images],
  )
  const maxSteps = safeImages.length
  const visibleStep = maxSteps > 0 ? Math.min(activeStep, maxSteps - 1) : 0
  const currentImage = safeImages[visibleStep] || null

  function handleStepChange(nextStep) {
    setActiveStep(() => {
      if (maxSteps === 0) return 0
      return Math.max(0, Math.min(nextStep, maxSteps - 1))
    })
  }

  function handleNext() {
    handleStepChange(visibleStep + 1)
  }

  function handleBack() {
    handleStepChange(visibleStep - 1)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      handleNext()
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      handleBack()
    }
  }

  function handleRemoveCurrentImage(event) {
    event.stopPropagation()
    if (!currentImage || !onRemoveImage) return

    onRemoveImage(currentImage.id)

    if (visibleStep === maxSteps - 1) {
      handleStepChange(visibleStep - 1)
    }
  }

  return (
    <div className="acc-carousel" onKeyDown={handleKeyDown}>
      <button
        className="acc-photo-area acc-carousel-stage"
        onClick={() => currentImage?.photoUrl && setZoomOpen(true)}
        title={currentImage?.photoUrl ? 'Zoom photo' : 'No photo'}
        aria-label={
          currentImage?.photoUrl
            ? `Zoom record photo ${visibleStep + 1} from ${recordDate}`
            : `Health record from ${recordDate} has no photo`
        }
        tabIndex={0}
        type="button"
      >
        {currentImage?.photoUrl ? (
          <>
            <img src={currentImage.photoUrl} alt={`Record ${visibleStep + 1}`} className="acc-photo-img" />
            {maxSteps > 1 && (
              <span className="acc-carousel-count">
                {visibleStep + 1} / {maxSteps}
              </span>
            )}
            {editMode && (
              <button
                className="acc-carousel-delete"
                onClick={handleRemoveCurrentImage}
                aria-label={`Remove image ${visibleStep + 1}`}
                type="button"
              >
                x
              </button>
            )}
          </>
        ) : (
          <div className="acc-photo-placeholder">
            <svg width="40" height="40" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="12" width="60" height="48" rx="4" stroke="#9ca3af" strokeWidth="3" fill="none"/>
              <circle cx="35" cy="32" r="10" stroke="#9ca3af" strokeWidth="3" fill="none"/>
              <path d="M5 52 L20 38 L32 50 L47 35 L65 52" stroke="#9ca3af" strokeWidth="3" fill="none"/>
              <circle cx="58" cy="58" r="10" fill="#6b7280"/>
              <path d="M58 53v10M53 58h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span>No Photos</span>
          </div>
        )}
      </button>

      {maxSteps > 1 && (
        <div className="acc-carousel-stepper-wrap">
          <MobileStepper
            variant="dots"
            steps={maxSteps}
            position="static"
            activeStep={visibleStep}
            className="acc-carousel-stepper"
            nextButton={(
              <IconButton
                size="small"
                onClick={event => {
                  event.stopPropagation()
                  handleNext()
                }}
                disabled={visibleStep === maxSteps - 1}
                aria-label="Next image"
                type="button"
              >
                <ArrowRightIcon />
              </IconButton>
            )}
            backButton={(
              <IconButton
                size="small"
                onClick={event => {
                  event.stopPropagation()
                  handleBack()
                }}
                disabled={visibleStep === 0}
                aria-label="Previous image"
                type="button"
              >
                <ArrowLeftIcon />
              </IconButton>
            )}
          />
        </div>
      )}

      {editMode && (
        <button
          className="acc-change-photo-btn"
          onClick={onChangePhotoClick}
          type="button"
        >
          {maxSteps > 0 ? 'Add More Photos' : 'Add Photos'}
        </button>
      )}

      {pendingUploadsCount > 0 && (
        <div className="acc-carousel-pending">
          {pendingUploadsCount} new photo{pendingUploadsCount > 1 ? 's' : ''} ready to save
        </div>
      )}

      {zoomOpen && currentImage?.photoUrl && (
        <div className="acc-photo-zoom" onClick={() => setZoomOpen(false)}>
          <button
            className="acc-photo-zoom-close"
            onClick={() => setZoomOpen(false)}
            aria-label="Close record photo zoom"
            type="button"
          >
            x
          </button>
          {maxSteps > 1 && (
            <>
              <button
                className="acc-photo-zoom-nav left"
                onClick={e => {
                  e.stopPropagation()
                  handleBack()
                }}
                disabled={visibleStep === 0}
                aria-label="Previous zoomed image"
                type="button"
              >
                <ArrowLeftIcon />
              </button>
              <button
                className="acc-photo-zoom-nav right"
                onClick={e => {
                  e.stopPropagation()
                  handleNext()
                }}
                disabled={visibleStep === maxSteps - 1}
                aria-label="Next zoomed image"
                type="button"
              >
                <ArrowRightIcon />
              </button>
            </>
          )}
          <img src={currentImage.photoUrl} alt={`Record ${visibleStep + 1}`} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

export default ImageCarousel
