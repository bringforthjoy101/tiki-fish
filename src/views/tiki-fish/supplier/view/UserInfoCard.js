// ** React Imports
import { useState, Fragment, useEffect } from 'react'
import { Link } from 'react-router-dom'

// ** Third Party Components
import { Row, Col, Card, CardBody, Button, Badge, CardText, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Spinner } from 'reactstrap'
import { Briefcase, Calendar, MapPin, Phone, Mail, User, Edit, Trash2, Package, DollarSign, Truck } from 'react-feather'
import { useForm, Controller } from 'react-hook-form'
import Select from 'react-select'
import classnames from 'classnames'
import { selectThemeColors, apiRequest, swal } from '@utils'
import moment from 'moment'

// ** Store & Actions
import { deleteSupplier, getSupplier } from '../store/action'
import { store } from '@store/storeConfig/store'

const UserInfoCard = ({ selectedSupplier }) => {
  // ** State
  const [isLoading, setIsLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // ** Fetch products
  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const response = await apiRequest({
        url: '/products',
        method: 'GET'
      }, store.dispatch)

      if (response && response.data && response.data.status) {
        // Transform products for react-select
        const productOptions = response.data.data.map(product => ({
          value: product.id,
          label: product.name,
          product
        }))
        setProducts(productOptions)
      } else {
        // If API fails, provide some dummy data for testing
        swal('Error', 'Failed to fetch products', 'error')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      swal('Error', 'Failed to fetch products', 'error')
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // ** Toggle modal
  const toggleModal = () => {
    setModal(!modal)
    if (!modal) {
      // Fetch products when opening the modal
      fetchProducts()
    }
  }

  // ** Form
  const { control, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      name: '',
      supplierId: selectedSupplier?.id || '',
      quantity: '',
      unitPrice: '',
      totalAmount: '',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      amountPaid: '',
      paymentDueDate: '',
      notes: ''
    }
  })

  // ** Handle product selection
  const handleProductChange = (selectedOption) => {
    setValue('productId', selectedOption.value)
    // If product has a default price, set it as unit price
    if (selectedOption.product && selectedOption.product.price) {
      setValue('unitPrice', selectedOption.product.price)
    }
  }

  // Watch quantity and unitPrice to calculate totalAmount
  const quantity = watch('quantity')
  const unitPrice = watch('unitPrice')

  // Update totalAmount when quantity or unitPrice changes
  useEffect(() => {
    if (quantity && unitPrice) {
      setValue('totalAmount', (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2))
    }
  }, [quantity, unitPrice, setValue])

  // ** Handle Delete
  const handleDelete = id => {
    setIsLoading(true)
    store.dispatch(deleteSupplier(id))
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  // ** Handle Supply Form Submit
  const onSubmitSupply = data => {
    setIsSubmitting(true)
    
    // Make API call to create supply
    apiRequest({
      url: '/supplies/create',
      method: 'POST',
      body: JSON.stringify({
        ...data,
        // Ensure supplierId is included
        supplierId: selectedSupplier.id
      })
    }, store.dispatch)
      .then(async response => {
        setIsSubmitting(false)
        if (response && response.data && response.data.status) {
          swal('Success', 'Supply logged successfully', 'success')
          await getSupplier(selectedSupplier.id)
          toggleModal()
          reset()
        } else {
          swal('Error', response?.data?.message || 'Something went wrong', 'error')
          reset()
        }
      })
      .catch(error => {
        setIsSubmitting(false)
        swal('Error', 'Failed to log supply', 'error')
        reset()
        console.error(error)
      })
  }

  // ** Render Supplier Details
  const renderSupplierDetails = () => {
    if (selectedSupplier !== null) {
      return (
        <Fragment>
          <div className='user-avatar-section'>
            <div className='d-flex justify-content-start'>
              <div className='d-flex flex-column ml-1'>
                <div className='user-info mb-1'>
                  <h4 className='mb-0'>{selectedSupplier.name}</h4>
                  <CardText tag='span'>
                    {selectedSupplier.phone}
                  </CardText>
                </div>
                <div className='d-flex flex-wrap align-items-center'>
                  <Button.Ripple tag={Link} to={`/supplier/edit/${selectedSupplier.id}`} color='primary' className='mr-1'>
                    <Edit className='mr-50' size={14} />
                    <span className='align-middle'>Edit</span>
                  </Button.Ripple>
                  <Button.Ripple color='success' className='mr-1' onClick={toggleModal}>
                    <Package className='mr-50' size={14} />
                    <span className='align-middle'>Log Supply</span>
                  </Button.Ripple>
                  <Button.Ripple color='danger' outline onClick={() => handleDelete(selectedSupplier.id)} disabled={isLoading}>
                    <Trash2 className='mr-50' size={14} />
                    <span className='align-middle'>Delete</span>
                  </Button.Ripple>
                </div>
              </div>
            </div>
          </div>
          <div className='mt-2'>
            <h4 className='mb-1'>Details:</h4>
            <div className='d-flex flex-wrap align-items-center mt-1'>
              <div className='user-info-title'>
                <Phone className='mr-1' size={14} />
                <CardText tag='span' className='user-info-title font-weight-bold mb-0'>
                  Phone
                </CardText>
              </div>
              <CardText className='mb-0 ml-75'>
                {selectedSupplier.phone || 'N/A'}
              </CardText>
            </div>
            
            <div className='d-flex flex-wrap align-items-center mt-1'>
              <div className='user-info-title'>
                <Briefcase className='mr-1' size={14} />
                <CardText tag='span' className='user-info-title font-weight-bold mb-0'>
                  Status
                </CardText>
              </div>
              <CardText className='text-capitalize mb-0 ml-75'>
                <Badge color={selectedSupplier.status === 'active' ? 'light-success' : selectedSupplier.status === 'inactive' ? 'light-secondary' : 'light-warning'} pill>
                  {selectedSupplier.status}
                </Badge>
              </CardText>
            </div>
            <div className='d-flex flex-wrap align-items-center mt-1'>
              <div className='user-info-title'>
                <User className='mr-1' size={14} />
                <CardText tag='span' className='user-info-title font-weight-bold mb-0'>
                  Bank Name
                </CardText>
              </div>
              <CardText className='mb-0 ml-75'>
                {selectedSupplier.bankName || 'N/A'}
              </CardText>
            </div>
            <div className='d-flex flex-wrap align-items-center mt-1'>
              <div className='user-info-title'>
                <Mail className='mr-1' size={14} />
                <CardText tag='span' className='user-info-title font-weight-bold mb-0'>
                    Bank Account Number
                </CardText>
              </div>
              <CardText className='mb-0 ml-75'>
                {selectedSupplier.accountNumber || 'N/A'}
              </CardText>
            </div>
            <div className='d-flex flex-wrap align-items-center mt-1'>
              <div className='user-info-title'>
                <User className='mr-1' size={14} />
                <CardText tag='span' className='user-info-title font-weight-bold mb-0'>
                  Account Name
                </CardText>
              </div>
              <CardText className='mb-0 ml-75'>
                {selectedSupplier.accountName || 'N/A'}
              </CardText>
            </div>
            <div className='d-flex flex-wrap align-items-center mt-1'>
              <div className='user-info-title'>
                <MapPin className='mr-1' size={14} />
                <CardText tag='span' className='user-info-title font-weight-bold mb-0'>
                  Address
                </CardText>
              </div>
              <CardText className='mb-0 ml-75'>
                {selectedSupplier.address || 'N/A'}
              </CardText>
            </div>
            <div className='d-flex flex-wrap align-items-center mt-1'>
              <div className='user-info-title'>
                <Calendar className='mr-1' size={14} />
                <CardText tag='span' className='user-info-title font-weight-bold mb-0'>
                  Last Supply
                </CardText>
              </div>
              <CardText className='mb-0 ml-75'>
                {selectedSupplier.statistics.lastSupplyDate ? moment(selectedSupplier.statistics.lastSupplyDate).format('ll') : 'N/A'}
              </CardText>
            </div>

            <div className='d-flex flex-wrap align-items-center mt-1'>
              <div className='user-info-title'>
                <DollarSign className='mr-1' size={14} />
                <CardText tag='span' className='user-info-title font-weight-bold mb-0'>
                  Total Owed
                </CardText>
              </div>
              <CardText className={`mb-0 ml-75 ${selectedSupplier.statistics.totalOwed > 0 ? 'text-danger' : 'text-success'}`}>
                {(selectedSupplier.statistics.totalOwed || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
              </CardText>
            </div>

            <div className='d-flex flex-wrap align-items-center mt-1'>
              <div className='user-info-title'>
                <DollarSign className='mr-1' size={14} />
                <CardText tag='span' className='user-info-title font-weight-bold mb-0'>
                  Total Paid
                </CardText>
              </div>
              <CardText className='mb-0 ml-75'>
                {(selectedSupplier.statistics.totalPaid || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
              </CardText>
            </div>

            <div className='d-flex flex-wrap align-items-center mt-1'>
              <div className='user-info-title'>
                <Truck className='mr-1' size={14} />
                <CardText tag='span' className='user-info-title font-weight-bold mb-0'>
                  Total Supplies
                </CardText>
              </div>
              <CardText className='mb-0 ml-75'>
                {selectedSupplier.statistics.totalSupplies || 0} - ({(selectedSupplier.statistics.totalAmount || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })})
              </CardText>
            </div>
          </div>

          {/* Supply Modal */}
          <Modal isOpen={modal} toggle={toggleModal} className='modal-dialog-centered modal-lg'>
            <ModalHeader toggle={toggleModal}>Log Supply from {selectedSupplier.name}</ModalHeader>
            <ModalBody>
              <Form onSubmit={handleSubmit(onSubmitSupply)}>
                <Row>
                  <Col md='6' sm='12'>
                    <FormGroup>
                      <Label for='name'>Product <span className='text-danger'>*</span></Label>
                      <Controller
                        name='name'
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Input
                            type='text'
                            id='name'
                            placeholder='Enter product name'
                            invalid={errors.name && true}
                            {...field}
                          />
                        )}
                      />
                      {errors.name && <small className='text-danger'>Product is required</small>}
                    </FormGroup>
                  </Col>
                  <Col md='6' sm='12'>
                    <FormGroup>
                      <Label for='supplierId'>Supplier ID</Label>
                      <Controller
                        name='supplierId'
                        control={control}
                        render={({ field }) => (
                          <Input
                            id='supplierId'
                            value={selectedSupplier.id}
                            disabled
                            {...field}
                          />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md='4' sm='12'>
                    <FormGroup>
                      <Label for='quantity'>Quantity <span className='text-danger'>*</span></Label>
                      <Controller
                        name='quantity'
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Input
                            type='number'
                            id='quantity'
                            placeholder='Enter quantity'
                            invalid={errors.quantity && true}
                            {...field}
                          />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md='4' sm='12'>
                    <FormGroup>
                      <Label for='unitPrice'>Unit Price <span className='text-danger'>*</span></Label>
                      <Controller
                        name='unitPrice'
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Input
                            type='number'
                            id='unitPrice'
                            placeholder='Enter unit price'
                            invalid={errors.unitPrice && true}
                            {...field}
                          />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md='4' sm='12'>
                    <FormGroup>
                      <Label for='totalAmount'>Total Amount</Label>
                      <Controller
                        name='totalAmount'
                        control={control}
                        render={({ field }) => (
                          <Input
                            type='number'
                            id='totalAmount'
                            placeholder='Total amount'
                            disabled
                            {...field}
                          />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md='6' sm='12'>
                    <FormGroup>
                      <Label for='paymentStatus'>Payment Status</Label>
                      <Controller
                        name='paymentStatus'
                        control={control}
                        render={({ field }) => (
                          <Input
                            type='select'
                            id='paymentStatus'
                            {...field}
                          >
                            <option value='paid'>Paid</option>
                            <option value='unpaid'>Unpaid</option>
                            <option value='partial'>Partial</option>
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md='6' sm='12'>
                    <FormGroup>
                      <Label for='paymentMethod'>Payment Method</Label>
                      <Controller
                        name='paymentMethod'
                        control={control}
                        render={({ field }) => (
                          <Input
                            type='select'
                            id='paymentMethod'
                            {...field}
                          >
                            <option value='cash'>Cash</option>
                            <option value='bank-transfer'>Bank Transfer</option>
                            <option value='credit'>Credit</option>
                          </Input>
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md='6' sm='12'>
                    <FormGroup>
                      <Label for='amountPaid'>Amount Paid</Label>
                      <Controller
                        name='amountPaid'
                        control={control}
                        render={({ field }) => (
                          <Input
                            type='number'
                            id='amountPaid'
                            placeholder='Enter amount paid'
                            {...field}
                          />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col md='6' sm='12'>
                    <FormGroup>
                      <Label for='paymentDueDate'>Payment Due Date</Label>
                      <Controller
                        name='paymentDueDate'
                        control={control}
                        render={({ field }) => (
                          <Input
                            type='date'
                            id='paymentDueDate'
                            {...field}
                          />
                        )}
                      />
                    </FormGroup>
                  </Col>
                  <Col sm='12'>
                    <FormGroup>
                      <Label for='notes'>Notes</Label>
                      <Controller
                        name='notes'
                        control={control}
                        render={({ field }) => (
                          <Input
                            type='textarea'
                            id='notes'
                            placeholder='Enter notes about this supply'
                            {...field}
                          />
                        )}
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col className='d-flex justify-content-end'>
                    <Button color='secondary' className='mr-1' onClick={toggleModal} outline>
                      Cancel
                    </Button>
                    <Button color='primary' type='submit' disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Spinner size='sm' color='white' className='mr-50' />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        'Submit'
                      )}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </ModalBody>
          </Modal>
        </Fragment>
      )
    } else {
      return null
    }
  }

  return (
    <Card>
      <CardBody>
        {renderSupplierDetails()}
      </CardBody>
    </Card>
  )
}

export default UserInfoCard 