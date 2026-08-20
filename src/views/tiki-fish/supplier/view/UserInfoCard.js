// ** React Imports
import { useState, Fragment, useEffect } from 'react'
import { Link } from 'react-router-dom'

// ** Third Party Components
import { Row, Col, Card, CardBody, Button, Badge, CardText, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Spinner, Alert } from 'reactstrap'
import { Briefcase, Calendar, MapPin, Phone, Mail, User, Edit, Trash2, Package, DollarSign, Truck } from 'react-feather'
import { useForm, Controller } from 'react-hook-form'
import Select from 'react-select'
import classnames from 'classnames'
import { selectThemeColors, apiRequest, swal } from '@utils'
import moment from 'moment'

// ** Store & Actions
import { deleteSupplier, getSupplier } from '../store/action'
import { store } from '@store/storeConfig/store'

// The only units the stock ledger can express. inventoryMovements.unit is an ENUM of exactly
// these six, and the server runs a non-strict sql_mode — so a free-typed unit is not rejected,
// it is stored as an empty string and the stock lands in a balance nothing can query. A select
// is the fix; the server re-checks it in createSupply regardless.
const MOVEMENT_UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'pcs', label: 'Piece' },
  { value: 'pack', label: 'Pack' },
  { value: 'carton', label: 'Carton' },
  { value: 'roll', label: 'Roll' },
  { value: 'l', label: 'Litre' }
]

const UserInfoCard = ({ selectedSupplier }) => {
  // ** State
  const [isLoading, setIsLoading] = useState(false)
  const [modal, setModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [packagingItems, setPackagingItems] = useState([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  // Collected at delivery because expenses.departmentId and expenses.categoryId are both NOT
  // NULL: a supply that carries neither cannot be paid from an account later without the
  // person paying having to guess what it was for.
  const [departments, setDepartments] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])
  const [classificationsFailed, setClassificationsFailed] = useState(false)

  // ** Fetch packaging items.
  //
  // Supplies are packaging and consumables — cartons, sacks, ice, wrap — not finished goods,
  // so this list comes from the packaging register, not /products. Choosing from it is what
  // sets packagingItemId, and packagingItemId is what makes createSupply post the delivery
  // into the packaging ledger. Typing a free-text name instead records the cost and stocks
  // nothing, which is how the 32 unmapped supply-name strings accumulated.
  const fetchPackagingItems = async () => {
    setIsLoadingItems(true)
    try {
      const response = await apiRequest({ url: '/packaging-items', method: 'GET' }, store.dispatch)

      if (response && response.data && response.data.status) {
        setPackagingItems(response.data.data || [])
      } else {
        swal('Error', response?.data?.message || 'Failed to load packaging items', 'error')
      }
    } catch (error) {
      console.error('Error fetching packaging items:', error)
      swal('Error', 'Failed to load packaging items', 'error')
    } finally {
      setIsLoadingItems(false)
    }
  }

  // ** Reference lists for classifying the spend.
  //
  // Both fields are required by the form, so a silent failure here is NOT survivable: it leaves
  // a mandatory dropdown with nothing in it and the clerk pressing Submit against a validation
  // hint that no amount of typing can clear. Record the failure so the modal can say so.
  const fetchClassifications = async () => {
    setClassificationsFailed(false)
    try {
      const [deptRes, catRes] = await Promise.all([
        apiRequest({ url: '/departments', method: 'GET' }, store.dispatch),
        apiRequest({ url: '/expense-categories', method: 'GET' }, store.dispatch)
      ])
      const departmentList = deptRes?.data?.status ? deptRes.data.data || [] : []
      const categoryList = catRes?.data?.status ? catRes.data.data || [] : []
      setDepartments(departmentList)
      setExpenseCategories(categoryList)
      if (!departmentList.length || !categoryList.length) setClassificationsFailed(true)
    } catch (error) {
      console.error('Error fetching classifications:', error)
      setClassificationsFailed(true)
    }
  }

  // ** Toggle modal
  const toggleModal = () => {
    setModal(!modal)
    if (!modal) {
      fetchPackagingItems()
      fetchClassifications()
    }
  }

  // ** Form
  const { control, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      packagingItemId: '',
      name: '',
      unit: '',
      departmentId: '',
      categoryId: '',
      // The day the goods arrived. Left unsent, createSupply stamps today — so a delivery
      // keyed on Monday for a Friday drop lands in the wrong period and the ledger cut is
      // wrong by three days.
      supplyDate: moment().format('YYYY-MM-DD'),
      supplierId: selectedSupplier?.id || '',
      quantity: '',
      unitPrice: '',
      totalAmount: '',
      // 'unpaid', not 'pending': the API accepts only paid | partial | unpaid, so 'pending'
      // was rejected with a 400 unless the user happened to touch the dropdown — which the
      // select never forced, because it renders the first option while holding a value that
      // matches none of them.
      paymentStatus: 'unpaid',
      paymentMethod: 'credit',
      amountPaid: '',
      paymentDueDate: '',
      notes: ''
    }
  })

  // ** Adopt the chosen item's name and unit.
  //
  // `name` stays the human label the rest of the app already reads, and the unit defaults to
  // the one the item is normally bought in — still editable, because the packaging ledger
  // keeps a separate balance per unit and a delivery must land against the right one.
  const handleItemChange = (event) => {
    const { value } = event.target
    setValue('packagingItemId', value)
    const item = packagingItems.find((candidate) => String(candidate.id) === String(value))
    if (!item) return
    setValue('name', item.name)
    setValue('unit', item.unit || '')
    // Packaging items carry their own expense category; adopt it so the person logging a
    // delivery does not have to classify what the register already knows.
    if (item.categoryId) setValue('categoryId', item.categoryId)
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

    // Drop empty strings before sending. express-validator's .optional() skips only `undefined`,
    // NOT '', so an untouched optional date field arrives as '' and fails .isISO8601() — a 400 on
    // every submission where the clerk left "Payment Due Date" blank, which is most of them.
    const payload = { supplierId: selectedSupplier.id }
    for (const [key, value] of Object.entries(data)) {
      if (value === '' || value === null || value === undefined) continue
      payload[key] = value
    }

    // Make API call to create supply
    apiRequest({
      url: '/supplies/create',
      method: 'POST',
      body: JSON.stringify(payload)
    }, store.dispatch)
      .then(async response => {
        setIsSubmitting(false)
        if (response && response.data && response.data.status) {
          swal('Success', 'Supply logged successfully', 'success')
          // dispatch(), not a bare call: getSupplier is a thunk CREATOR, so `await
          // getSupplier(id)` awaited a function object, issued no request and dispatched
          // nothing. The supply list and the owed totals therefore never showed the row that
          // had just been saved, and the obvious reaction is to key the delivery a second time
          // - which posts a second packaging movement, since the UNIQUE key on
          // inventoryMovements.supplyId stops one supply being stocked twice, not two supplies
          // describing one delivery.
          await store.dispatch(getSupplier(selectedSupplier.id))
          toggleModal()
          reset()
        } else {
          // A validator rejection comes back as {errors:[{msg}]}, not {message} — without this
          // the clerk saw a bare "Something went wrong" and no way to tell which field.
          // Deliberately NOT reset(): wiping a rejected form loses everything they just keyed,
          // and the delivery has to be typed again from the paper invoice.
          const validation = response?.data?.errors?.map(e => e.msg).join(', ')
          swal('Error', validation || response?.data?.message || 'Something went wrong', 'error')
        }
      })
      .catch(error => {
        setIsSubmitting(false)
        swal('Error', 'Failed to log supply', 'error')
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
                  {classificationsFailed && (
                    <Col sm='12'>
                      <Alert color='danger' className='p-1'>
                        Departments or expense categories could not be loaded, and both are needed
                        before a supply can be paid. Close this and try again — do not re-type the
                        delivery until the lists appear.
                      </Alert>
                    </Col>
                  )}
                  {!isLoadingItems && packagingItems.length === 0 && (
                    <Col sm='12'>
                      <Alert color='warning' className='p-1'>
                        No packaging items exist yet. Add them under <b>Reference data</b> first — until then a
                        delivery records its cost but does not enter the packaging ledger.
                      </Alert>
                    </Col>
                  )}
                  <Col md='6' sm='12'>
                    <FormGroup>
                      <Label for='packagingItemId'>Item <span className='text-danger'>*</span></Label>
                      <Controller
                        name='packagingItemId'
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Input
                            type='select'
                            id='packagingItemId'
                            invalid={errors.packagingItemId && true}
                            {...field}
                            onChange={handleItemChange}
                            disabled={isLoadingItems}
                          >
                            <option value=''>{isLoadingItems ? 'Loading…' : 'Choose an item…'}</option>
                            {packagingItems.map(item => (
                              <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.packagingItemId && <small className='text-danger'>Choose what was delivered</small>}
                    </FormGroup>
                  </Col>
                  <Col md='3' sm='12'>
                    <FormGroup>
                      <Label for='unit'>Measured in <span className='text-danger'>*</span></Label>
                      <Controller
                        name='unit'
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Input type='select' id='unit' invalid={errors.unit && true} {...field}>
                            <option value=''>Choose…</option>
                            {MOVEMENT_UNITS.map(u => (
                              <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                          </Input>
                        )}
                      />
                      <small className='text-muted'>Balances are kept per unit.</small>
                    </FormGroup>
                  </Col>
                  <Col md='6' sm='12'>
                    <FormGroup>
                      <Label for='departmentId'>Department <span className='text-danger'>*</span></Label>
                      <Controller
                        name='departmentId'
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Input type='select' id='departmentId' invalid={errors.departmentId && true} {...field}>
                            <option value=''>Choose…</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.departmentId && <small className='text-danger'>Needed before this can be paid</small>}
                    </FormGroup>
                  </Col>
                  <Col md='6' sm='12'>
                    <FormGroup>
                      <Label for='categoryId'>Expense category <span className='text-danger'>*</span></Label>
                      <Controller
                        name='categoryId'
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Input type='select' id='categoryId' invalid={errors.categoryId && true} {...field}>
                            <option value=''>Choose…</option>
                            {expenseCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </Input>
                        )}
                      />
                      {errors.categoryId && <small className='text-danger'>Needed before this can be paid</small>}
                    </FormGroup>
                  </Col>
                  <Col md='3' sm='12'>
                    <FormGroup>
                      <Label for='supplyDate'>Delivered on <span className='text-danger'>*</span></Label>
                      <Controller
                        name='supplyDate'
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Input
                            type='date'
                            id='supplyDate'
                            max={moment().format('YYYY-MM-DD')}
                            invalid={errors.supplyDate && true}
                            {...field}
                          />
                        )}
                      />
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