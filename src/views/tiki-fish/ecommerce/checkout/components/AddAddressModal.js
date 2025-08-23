// ** React Imports
import { useState } from 'react'
import { MapPin, X } from 'react-feather'

// ** Reactstrap Imports
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Spinner,
  Alert,
  CustomInput
} from 'reactstrap'

// ** Third Party Components
import { AvForm, AvInput } from 'availity-reactstrap-validation-safe'

// ** Utils
import { apiRequest, swal } from '@utils'

const AddAddressModal = ({ 
  isOpen, 
  toggle, 
  customerId, 
  onSuccess,
  dispatch 
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [addressData, setAddressData] = useState({
    title: '',
    streetAddress: '',
    city: '',
    state: '',
    country: 'Nigeria',
    zipCode: '',
    isDefault: false
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setAddressData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (event, errors) => {
    event.preventDefault()
    
    if (errors && errors.length > 0) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiRequest({
        url: `/customers/${customerId}/addresses`,
        method: 'POST',
        body: JSON.stringify(addressData)
      }, dispatch)

      if (response.data.status) {
        swal('Success!', 'Address added successfully', 'success')
        
        // Reset form
        setAddressData({
          title: '',
          streetAddress: '',
          city: '',
          state: '',
          country: 'Nigeria',
          zipCode: '',
          isDefault: false
        })
        
        // Call success callback
        if (onSuccess) {
          onSuccess(response.data.data)
        }
        
        // Close modal
        toggle()
      } else {
        setError(response.data.message || 'Failed to add address')
      }
    } catch (err) {
      console.error('Error adding address:', err)
      setError('Failed to add address. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form on close
    setAddressData({
      title: '',
      streetAddress: '',
      city: '',
      state: '',
      country: 'Nigeria',
      zipCode: '',
      isDefault: false
    })
    setError(null)
    toggle()
  }

  // Nigerian states for dropdown
  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 
    'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 
    'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 
    'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ]

  return (
    <Modal isOpen={isOpen} toggle={handleClose} size="md">
      <ModalHeader toggle={handleClose}>
        <MapPin size={20} className="mr-2" />
        Add New Address
      </ModalHeader>
      
      <AvForm onSubmit={handleSubmit}>
        <ModalBody>
          {error && (
            <Alert color="danger">
              {error}
            </Alert>
          )}

          <FormGroup>
            <Label for="title">
              Address Label <span className="text-danger">*</span>
            </Label>
            <AvInput
              name="title"
              id="title"
              placeholder="e.g., Home, Office, Shop"
              value={addressData.title}
              onChange={handleInputChange}
              required
              validate={{
                required: { value: true, errorMessage: 'Address label is required' },
                minLength: { value: 2, errorMessage: 'Must be at least 2 characters' }
              }}
            />
          </FormGroup>

          <FormGroup>
            <Label for="streetAddress">
              Street Address <span className="text-danger">*</span>
            </Label>
            <AvInput
              type="textarea"
              name="streetAddress"
              id="streetAddress"
              placeholder="Enter full street address"
              value={addressData.streetAddress}
              onChange={handleInputChange}
              rows="2"
              required
              validate={{
                required: { value: true, errorMessage: 'Street address is required' },
                minLength: { value: 5, errorMessage: 'Must be at least 5 characters' }
              }}
            />
          </FormGroup>

          <div className="row">
            <div className="col-md-6">
              <FormGroup>
                <Label for="city">
                  City <span className="text-danger">*</span>
                </Label>
                <AvInput
                  name="city"
                  id="city"
                  placeholder="e.g., Lagos"
                  value={addressData.city}
                  onChange={handleInputChange}
                  required
                  validate={{
                    required: { value: true, errorMessage: 'City is required' }
                  }}
                />
              </FormGroup>
            </div>

            <div className="col-md-6">
              <FormGroup>
                <Label for="state">
                  State <span className="text-danger">*</span>
                </Label>
                <AvInput
                  type="select"
                  name="state"
                  id="state"
                  value={addressData.state}
                  onChange={handleInputChange}
                  required
                  validate={{
                    required: { value: true, errorMessage: 'State is required' }
                  }}
                >
                  <option value="">Select State</option>
                  {nigerianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </AvInput>
              </FormGroup>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <FormGroup>
                <Label for="country">Country</Label>
                <Input
                  name="country"
                  id="country"
                  value={addressData.country}
                  onChange={handleInputChange}
                  disabled
                />
              </FormGroup>
            </div>

            <div className="col-md-6">
              <FormGroup>
                <Label for="zipCode">Zip/Postal Code</Label>
                <AvInput
                  name="zipCode"
                  id="zipCode"
                  placeholder="e.g., 100001"
                  value={addressData.zipCode}
                  onChange={handleInputChange}
                  validate={{
                    pattern: {
                      value: '^[0-9]{6}$|^$',
                      errorMessage: 'Must be 6 digits'
                    }
                  }}
                />
              </FormGroup>
            </div>
          </div>

          <FormGroup>
            <CustomInput
              type="checkbox"
              id="isDefault"
              name="isDefault"
              label="Set as default shipping address"
              checked={addressData.isDefault}
              onChange={handleInputChange}
            />
          </FormGroup>
        </ModalBody>

        <ModalFooter>
          <Button 
            color="secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            color="primary" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Adding...
              </>
            ) : (
              'Add Address'
            )}
          </Button>
        </ModalFooter>
      </AvForm>
    </Modal>
  )
}

export default AddAddressModal