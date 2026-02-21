// ** React Imports
import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'

// ** Reactstrap Imports
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Spinner,
  UncontrolledTooltip,
  Row,
  Col,
  Alert,
  Progress
} from 'reactstrap'

// ** Icons
import {
  Upload,
  X,
  Star,
  Move,
  Image as ImageIcon,
  AlertCircle,
  Check,
  RefreshCw
} from 'react-feather'

// ** Utils
import { apiRequest, swal } from '@utils'

// ** Styles
import './ImageUploader.scss'

let nextQueueId = 0

const ImageUploader = ({ productId, onImagesUpdate }) => {
  const [images, setImages] = useState([])
  const [uploadQueue, setUploadQueue] = useState([])
  const [loading, setLoading] = useState(false)
  const [draggedImage, setDraggedImage] = useState(null)
  const uploadQueueRef = useRef([])

  // Keep ref in sync with state for use inside async closures
  useEffect(() => {
    uploadQueueRef.current = uploadQueue
  }, [uploadQueue])

  // Fetch existing images
  const fetchImages = async () => {
    if (!productId) return

    try {
      const response = await apiRequest({
        url: `/products/${productId}/images`,
        method: 'GET'
      })

      if (response.data.status) {
        setImages(response.data.data || [])
        if (onImagesUpdate) {
          onImagesUpdate(response.data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [productId])

  // Update a single queue item by id
  const updateQueueItem = (id, updates) => {
    setUploadQueue(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)))
  }

  // Upload a single file
  const uploadSingleFile = async (queueItem) => {
    updateQueueItem(queueItem.id, { status: 'uploading', progress: 0 })

    const formData = new FormData()
    formData.append('images', queueItem.file)

    try {
      const response = await apiRequest({
        url: `/products/${productId}/images`,
        method: 'POST',
        body: formData,
        onUploadProgress: (e) => {
          if (e.total) {
            const progress = Math.round((e.loaded / e.total) * 100)
            updateQueueItem(queueItem.id, { progress })
          }
        }
      })

      if (response && response.data && response.data.status) {
        updateQueueItem(queueItem.id, { status: 'success', progress: 100 })
        // Refresh gallery to show the new image
        fetchImages()
      } else {
        const errorMsg = response?.data?.message || 'Upload failed'
        updateQueueItem(queueItem.id, { status: 'error', error: errorMsg })
      }
    } catch (error) {
      console.error('Upload error:', error)
      updateQueueItem(queueItem.id, { status: 'error', error: 'Network error' })
    }
  }

  // Upload files with concurrency limit
  const uploadWithConcurrency = async (queueItems, limit = 3) => {
    const queue = [...queueItems]
    const executing = []

    for (const item of queue) {
      const p = uploadSingleFile(item).then(() => {
        executing.splice(executing.indexOf(p), 1)
      })
      executing.push(p)

      if (executing.length >= limit) {
        await Promise.race(executing)
      }
    }

    // Wait for remaining uploads
    await Promise.allSettled(executing)

    // Auto-remove successful items after a brief delay
    setTimeout(() => {
      setUploadQueue(prev => {
        const remaining = prev.filter(item => item.status === 'error')
        // Revoke preview URLs for removed items
        prev.forEach(item => {
          if (item.status !== 'error') {
            URL.revokeObjectURL(item.preview)
          }
        })
        return remaining
      })
    }, 1500)
  }

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    const validFiles = acceptedFiles.filter(file => {
      const isValid = file.size <= 5 * 1024 * 1024 // 5MB limit
      if (!isValid) {
        swal('Error', `${file.name} exceeds 5MB limit`, 'error')
      }
      return isValid
    })

    if (validFiles.length === 0) return

    // Check if adding new images would exceed limit
    if (images.length + validFiles.length > 10) {
      swal('Error', `Cannot upload ${validFiles.length} images. Maximum 10 images allowed per product. Currently ${images.length} uploaded.`, 'error')
      return
    }

    // Create queue items with preview URLs
    const newItems = validFiles.map(file => ({
      id: ++nextQueueId,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
      error: null
    }))

    setUploadQueue(prev => [...prev, ...newItems])

    // Start concurrent uploads
    uploadWithConcurrency(newItems, 3)
  }, [images, productId])

  // Retry a failed upload
  const retryUpload = (itemId) => {
    const item = uploadQueueRef.current.find(i => i.id === itemId)
    if (!item) return
    updateQueueItem(itemId, { status: 'pending', progress: 0, error: null })
    uploadSingleFile(item)
  }

  // Remove a failed upload from queue
  const removeFromQueue = (itemId) => {
    setUploadQueue(prev => {
      const item = prev.find(i => i.id === itemId)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter(i => i.id !== itemId)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 10,
    multiple: true
  })

  // Delete image
  const handleDeleteImage = async (imageId) => {
    const confirmed = await swal({
      title: 'Are you sure?',
      text: 'This image will be permanently deleted',
      icon: 'warning',
      buttons: true,
      dangerMode: true
    })

    if (!confirmed) return

    try {
      setLoading(true)
      const response = await apiRequest({
        url: `/products/${productId}/images/${imageId}`,
        method: 'DELETE'
      })

      if (response.data.status) {
        swal('Success', 'Image deleted successfully', 'success')
        fetchImages()
      } else {
        swal('Error', response.data.message || 'Failed to delete image', 'error')
      }
    } catch (error) {
      console.error('Delete error:', error)
      swal('Error', 'Failed to delete image', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Set main image
  const handleSetMainImage = async (imageId) => {
    try {
      setLoading(true)
      const response = await apiRequest({
        url: `/products/${productId}/main-image/${imageId}`,
        method: 'PUT'
      })

      if (response.data.status) {
        swal('Success', 'Main image set successfully', 'success')
        fetchImages()
      } else {
        swal('Error', response.data.message || 'Failed to set main image', 'error')
      }
    } catch (error) {
      console.error('Set main error:', error)
      swal('Error', 'Failed to set main image', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Drag and drop reordering
  const handleDragStart = (e, index) => {
    setDraggedImage(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault()

    if (draggedImage === null || draggedImage === dropIndex) {
      return
    }

    const draggedItem = images[draggedImage]
    const newImages = [...images]

    // Remove dragged item
    newImages.splice(draggedImage, 1)
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedItem)

    setImages(newImages)
    setDraggedImage(null)

    // Update order on server
    try {
      const imageOrder = newImages.map(img => img.id)
      const response = await apiRequest({
        url: `/products/${productId}/images/reorder`,
        method: 'POST',
        body: JSON.stringify({ imageOrder })
      })

      if (response.data.status) {
        console.log('Images reordered successfully')
      } else {
        // Revert on error
        fetchImages()
        swal('Error', 'Failed to reorder images', 'error')
      }
    } catch (error) {
      console.error('Reorder error:', error)
      fetchImages()
      swal('Error', 'Failed to reorder images', 'error')
    }
  }

  if (!productId) {
    return (
      <Alert color="info">
        <AlertCircle size={14} className="mr-1" />
        Please save the product first before uploading images
      </Alert>
    )
  }

  // Computed values for overall progress
  const activeUploads = uploadQueue.filter(i => i.status === 'uploading' || i.status === 'pending')
  const completedUploads = uploadQueue.filter(i => i.status === 'success')
  const hasActiveUploads = activeUploads.length > 0
  const totalInQueue = uploadQueue.length
  const completedCount = completedUploads.length

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>Product Images</CardTitle>
        <Badge color="light-primary">{images.length}/10 images</Badge>
      </CardHeader>
      <CardBody>
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="d-flex align-items-center justify-content-center flex-column">
            <Upload size={64} className="mb-2" />
            <h5>Drop images here or click to browse</h5>
            <p className="text-secondary">
              Supports: JPG, PNG, WebP (Max 5MB per image)
            </p>
          </div>
        </div>

        {/* Overall Upload Progress */}
        {totalInQueue > 0 && (
          <div className="upload-status mt-2 mb-1">
            <div className="d-flex justify-content-between align-items-center mb-50">
              <small className="text-muted font-weight-bold">
                {hasActiveUploads ? `Uploading ${completedCount} of ${totalInQueue} images...` : `Upload complete — ${completedCount} of ${totalInQueue} succeeded`}
              </small>
            </div>
            <Progress
              value={totalInQueue > 0 ? (completedCount / totalInQueue) * 100 : 0}
              color={hasActiveUploads ? 'primary' : 'success'}
              style={{ height: '6px' }}
            />
          </div>
        )}

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <Row className="mt-2">
            {uploadQueue.map(item => (
              <Col key={item.id} lg={3} md={4} sm={6} className="mb-3">
                <div className={`image-preview uploading ${item.status}`}>
                  <img src={item.preview} alt={item.file.name} />

                  {/* Pending / Uploading state */}
                  {(item.status === 'pending' || item.status === 'uploading') && (
                    <div className="uploading-overlay">
                      <Spinner size="sm" />
                      <Progress
                        value={item.progress}
                        className="mt-1 upload-progress-bar"
                        style={{ height: '6px', width: '75%' }}
                      />
                      <small className="d-block mt-50">{item.progress}%</small>
                    </div>
                  )}

                  {/* Success state */}
                  {item.status === 'success' && (
                    <div className="uploading-overlay success-overlay">
                      <Check size={24} />
                      <small className="d-block mt-50">Uploaded</small>
                    </div>
                  )}

                  {/* Error state */}
                  {item.status === 'error' && (
                    <div className="uploading-overlay error-overlay">
                      <AlertCircle size={24} />
                      <small className="d-block mt-50 text-center px-1">{item.error || 'Upload failed'}</small>
                      <div className="mt-1 d-flex gap-50">
                        <Button size="sm" color="primary" className="d-flex align-items-center" onClick={() => retryUpload(item.id)}>
                          <RefreshCw size={12} className="mr-50" /> Retry
                        </Button>
                        <Button size="sm" color="flat-danger" className="d-flex align-items-center ml-50" onClick={() => removeFromQueue(item.id)}>
                          <X size={12} className="mr-50" /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        )}

        {/* Existing Images */}
        {images.length > 0 && (
          <Row className="mt-3">
            {images.map((image, index) => (
              <Col key={image.id} lg={3} md={4} sm={6} className="mb-3">
                <div
                  className="image-preview"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <img
                    src={image.thumbnailUrl || image.imageUrl}
                    alt={`Product ${index + 1}`}
                  />

                  {/* Main Image Badge */}
                  {image.imageType === 'main' && (
                    <Badge color="primary" className="main-badge">
                      <Star size={12} /> Main
                    </Badge>
                  )}

                  {/* Action Buttons */}
                  <div className="image-actions">
                    {image.imageType !== 'main' && (
                      <>
                        <Button
                          color="primary"
                          size="sm"
                          id={`set-main-${image.id}`}
                          onClick={() => handleSetMainImage(image.id)}
                          disabled={loading}
                        >
                          <Star size={14} />
                        </Button>
                        <UncontrolledTooltip
                          placement="top"
                          target={`set-main-${image.id}`}
                        >
                          Set as main image
                        </UncontrolledTooltip>
                      </>
                    )}

                    <Button
                      color="danger"
                      size="sm"
                      id={`delete-${image.id}`}
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={loading}
                    >
                      <X size={14} />
                    </Button>
                    <UncontrolledTooltip
                      placement="top"
                      target={`delete-${image.id}`}
                    >
                      Delete image
                    </UncontrolledTooltip>
                  </div>

                  {/* Drag Handle */}
                  <div className="drag-handle">
                    <Move size={16} />
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        {/* Empty State */}
        {images.length === 0 && uploadQueue.length === 0 && (
          <div className="text-center py-4">
            <ImageIcon size={48} className="text-muted mb-2" />
            <p className="text-muted">No images uploaded yet</p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default ImageUploader
