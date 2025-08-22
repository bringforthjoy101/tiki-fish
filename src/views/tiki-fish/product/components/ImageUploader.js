// ** React Imports
import { useState, useCallback, useEffect } from 'react'
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
  Alert
} from 'reactstrap'

// ** Icons
import { 
  Upload, 
  X, 
  Star, 
  Move, 
  Image as ImageIcon,
  AlertCircle 
} from 'react-feather'

// ** Utils
import { apiRequest, swal } from '@utils'

// ** Styles
import './ImageUploader.scss'

const ImageUploader = ({ productId, onImagesUpdate }) => {
  const [images, setImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [draggedImage, setDraggedImage] = useState(null)

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
      swal('Error', `Cannot upload ${validFiles.length} images. Maximum 10 images allowed per product.`, 'error')
      return
    }

    // Create preview URLs
    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      uploading: true
    }))

    setUploadingImages(newImages)

    // Upload images
    const formData = new FormData()
    validFiles.forEach(file => {
      formData.append('images', file)
    })

    try {
      const response = await apiRequest({
        url: `/products/${productId}/images`,
        method: 'POST',
        body: formData,
        isFormData: true
      })

      if (response.data.status) {
        swal('Success', response.data.message, 'success')
        // Refresh images list
        fetchImages()
      } else {
        swal('Error', response.data.message || 'Failed to upload images', 'error')
      }
    } catch (error) {
      console.error('Upload error:', error)
      swal('Error', 'Failed to upload images', 'error')
    } finally {
      setUploadingImages([])
      // Clean up preview URLs
      newImages.forEach(img => URL.revokeObjectURL(img.preview))
    }
  }, [images, productId])

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

        {/* Uploading Images */}
        {uploadingImages.length > 0 && (
          <Row className="mt-3">
            {uploadingImages.map((img, index) => (
              <Col key={index} lg={3} md={4} sm={6} className="mb-3">
                <div className="image-preview uploading">
                  <img src={img.preview} alt={img.name} />
                  <div className="uploading-overlay">
                    <Spinner size="sm" />
                    <small className="d-block mt-1">Uploading...</small>
                  </div>
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
        {images.length === 0 && uploadingImages.length === 0 && (
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