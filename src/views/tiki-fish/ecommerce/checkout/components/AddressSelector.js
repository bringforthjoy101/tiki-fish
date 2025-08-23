// ** React Imports
import { useState, useEffect } from 'react'
import { Plus, MapPin, Edit2, Trash2, Star } from 'react-feather'

// ** Reactstrap Imports
import { 
  Card, 
  CardBody, 
  CardTitle,
  Button, 
  Badge, 
  Row, 
  Col, 
  Spinner, 
  Alert,
  FormGroup,
  Label,
  Input
} from 'reactstrap'

// ** Utils
import { apiRequest } from '@utils'

const AddressSelector = ({ 
  customerId, 
  selectedAddress, 
  onAddressSelect, 
  onAddNew,
  dispatch 
}) => {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Define fetchAddresses before using it in useEffect
  const fetchAddresses = async () => {
    if (!customerId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiRequest({
        url: `/customers/${customerId}/addresses`,
        method: 'GET'
      }, dispatch)
      
      if (response.data.status) {
        const addressList = response.data.data || []
        setAddresses(addressList)
        
        // Auto-select default address or first address
        if (addressList.length > 0 && !selectedAddress) {
          const defaultAddr = addressList.find(addr => addr.isDefault)
          onAddressSelect(defaultAddr || addressList[0])
        }
      } else {
        setError(response.data.message || 'Failed to load addresses')
      }
    } catch (err) {
      console.error('Error fetching addresses:', err)
      setError('Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  // Fetch customer addresses when customerId changes
  useEffect(() => {
    if (customerId) {
      fetchAddresses()
    } else {
      setAddresses([])
      onAddressSelect(null)
    }
  }, [customerId])

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return
    
    try {
      const response = await apiRequest({
        url: `/addresses/${addressId}`,
        method: 'DELETE'
      }, dispatch)
      
      if (response.data.status) {
        // Refresh addresses after deletion
        fetchAddresses()
        
        // Clear selection if deleted address was selected
        if (selectedAddress?.id === addressId) {
          onAddressSelect(null)
        }
      }
    } catch (err) {
      console.error('Error deleting address:', err)
    }
  }

  const handleSetDefault = async (addressId) => {
    try {
      const response = await apiRequest({
        url: `/addresses/${addressId}/default`,
        method: 'PUT'
      }, dispatch)
      
      if (response.data.status) {
        // Refresh addresses to show updated default
        fetchAddresses()
      }
    } catch (err) {
      console.error('Error setting default address:', err)
    }
  }

  if (!customerId) {
    return (
      <Alert color="info">
        <MapPin size={16} className="mr-1" />
        Please select a customer first to manage addresses
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-3">
        <Spinner color="primary" />
        <p className="mt-2">Loading addresses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert color="danger">
        <MapPin size={16} className="mr-1" />
        {error}
      </Alert>
    )
  }

  return (
    <div className="address-selector">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Delivery Address</h6>
        <Button 
          color="primary" 
          size="sm" 
          onClick={onAddNew}
        >
          <Plus size={14} className="mr-1" />
          Add New Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Alert color="warning">
          <MapPin size={16} className="mr-1" />
          No addresses found for this customer. 
          <Button 
            color="link" 
            size="sm" 
            className="p-0 ml-1"
            onClick={onAddNew}
          >
            Add one now
          </Button>
        </Alert>
      ) : (
        <Row>
          {addresses.map((address) => (
            <Col md={6} key={address.id} className="mb-3">
              <Card 
                className={`address-card cursor-pointer ${
                  selectedAddress?.id === address.id ? 'border-primary' : ''
                }`}
                onClick={() => onAddressSelect(address)}
              >
                <CardBody>
                  <FormGroup check className="mb-2">
                    <Input
                      type="radio"
                      name="selectedAddress"
                      checked={selectedAddress?.id === address.id}
                      onChange={() => onAddressSelect(address)}
                    />
                    <Label check className="ml-1">
                      <strong>{address.title}</strong>
                      {address.isDefault && (
                        <Badge color="success" className="ml-2">
                          <Star size={10} /> Default
                        </Badge>
                      )}
                    </Label>
                  </FormGroup>
                  
                  <div className="address-details small">
                    <p className="mb-1">{address.streetAddress}</p>
                    <p className="mb-1">
                      {address.city}, {address.state}
                    </p>
                    <p className="mb-1">{address.country}</p>
                    {address.zipCode && (
                      <p className="mb-0">Zip: {address.zipCode}</p>
                    )}
                  </div>

                  <div className="mt-2 d-flex gap-2">
                    {!address.isDefault && (
                      <Button
                        color="link"
                        size="sm"
                        className="p-0 mr-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetDefault(address.id)
                        }}
                      >
                        <Star size={14} className="mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      color="link"
                      size="sm"
                      className="p-0 text-danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAddress(address.id)
                      }}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default AddressSelector