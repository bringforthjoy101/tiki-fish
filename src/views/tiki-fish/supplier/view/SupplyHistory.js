// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** Third Party Components
import { Row, Col, Card, CardBody, CardTitle, CardHeader, Table, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Button, Spinner, Form, FormGroup, Label, Input } from 'reactstrap'

// ** Store & Actions
import { getAllData, getSupplierSupplyHistory } from '../store/action'
import { useDispatch, useSelector } from 'react-redux'
import moment from 'moment'
import { apiRequest, swal } from '@utils'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

// ** Styles
import '@styles/react/libs/tables/react-dataTable-component.scss'

// Initialize MySwal
const MySwal = withReactContent(Swal)

const SupplyHistory = ({ id }) => {
  // ** State
  const [modal, setModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [selectedSupply, setSelectedSupply] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [processingPayment, setProcessingPayment] = useState(false)

  // ** Store Vars
  const dispatch = useDispatch()
  const store = useSelector(state => state.suppliers)

  // ** Toggle Modals
  const toggleModal = () => setModal(!modal)
  const togglePaymentModal = () => {
    if (!paymentModal) {
      // When opening payment modal, set default amount to remaining balance
      if (selectedSupply) {
        const remainingAmount = selectedSupply.totalAmount - (selectedSupply.amountPaid || 0)
        setPaymentAmount(remainingAmount > 0 ? remainingAmount.toString() : '0')
      }
    }
    setPaymentModal(!paymentModal)
  }

  // ** Fetch Supply Details
  const fetchSupplyDetails = async (supplyId) => {
    setLoading(true)
    try {
      const response = await apiRequest({
        url: `/supplies/get-detail/${supplyId}`,
        method: 'GET'
      }, dispatch)

      if (response && response.data && response.data.status) {
        // Set the selected supply with payment history
        setSelectedSupply(response.data.data)
      } else {
        // If API fails, use the basic data we already have
        const basicSupply = store.selectedSupplier.supplies.find(s => s.id === supplyId)
        setSelectedSupply(basicSupply || null)
      }
    } catch (error) {
      console.error('Error fetching supply details:', error)
    } finally {
      setLoading(false)
    }
  }

  // ** Update Supply Status
  const updateSupplyStatus = async (supplyId, status) => {
    // Ask for confirmation before proceeding
    const confirmMessage = status === 'received' ? 'Are you sure you want to mark this supply as received?' : 'Are you sure you want to cancel this supply?';
    
    // Use MySwal directly for confirmation with custom buttons
    const result = await MySwal.fire({
      title: 'Confirm Action',
      text: confirmMessage,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Proceed',
      cancelButtonText: 'No, Cancel',
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-outline-danger ml-1'
      },
      buttonsStyling: false
    })
    
    // If user didn't confirm, return early
    if (!result.isConfirmed) return
    
    setUpdating(true)
    try {
      const response = await apiRequest({
        url: `/supplies/update/${supplyId}`,
        method: 'POST',
        body: JSON.stringify({ status })
      }, dispatch)

      if (response && response.data && response.data.status) {
        // Update the local state
        setSelectedSupply(prev => ({ ...prev, status }))
        
        // Show success message
        swal('Success', `Supply has been ${status === 'received' ? 'marked as received' : 'cancelled'} successfully`, 'success')
        
        // Refresh the supplier data to update the supply history
        dispatch(getAllData())
      } else {
        swal('Error', response?.data?.message || 'Failed to update supply status', 'error')
      }
    } catch (error) {
      console.error('Error updating supply status:', error)
      swal('Error', 'Something went wrong while updating the supply status', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // ** Process Payment
  const processPayment = async (e) => {
    e.preventDefault()
    
    // Validate payment amount
    if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
      swal('Error', 'Please enter a valid payment amount', 'error')
      return
    }

    // Ask for confirmation
    const result = await MySwal.fire({
      title: 'Confirm Payment',
      text: `Are you sure you want to process a payment of ${parseFloat(paymentAmount).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Process Payment',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-outline-danger ml-1'
      },
      buttonsStyling: false
    })
    
    if (!result.isConfirmed) return

    setProcessingPayment(true)
    try {
      const response = await apiRequest({
        url: `/supplies/pay/${selectedSupply.id}`,
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          paymentMethod
        })
      }, dispatch)

      if (response && response.data && response.data.status) {
        // Show success message
        swal('Success', 'Payment processed successfully', 'success')
        
        // Close payment modal
        togglePaymentModal()
        
        // Refresh the supplier data
        // dispatch(getSupplierSupplyHistory(id))
        
        // Fetch updated supply details to show the new payment in the history
        fetchSupplyDetails(selectedSupply.id)
      } else {
        swal('Error', response?.data?.message || 'Failed to process payment', 'error')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      swal('Error', 'Something went wrong while processing the payment', 'error')
    } finally {
      setProcessingPayment(false)
    }
  }

  // ** Handle Row Click
  const handleRowClick = (supply) => {
    fetchSupplyDetails(supply.id)
    toggleModal()
  }

  // ** Add CSS for clickable rows
  useEffect(() => {
    // Add custom CSS for the supply rows
    const style = document.createElement('style')
    style.innerHTML = `
      .supply-row {
        transition: all 0.2s;
      }
      .supply-row:hover {
        background-color: rgba(115, 103, 240, 0.08) !important;
        transform: translateY(-1px);
        box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.1);
      }
    `
    document.head.appendChild(style)

    // Cleanup
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // ** Render supply history
  const renderSupplyHistory = () => {
    if (store.selectedSupplier.supplies && store.selectedSupplier.supplies.length) {
      return store.selectedSupplier.supplies.map((item, index) => {
        return (
          <tr 
            key={`${id}-${index}`} 
            onClick={() => handleRowClick(item)}
            style={{ cursor: 'pointer' }}
            className='supply-row'
          >
            <td>
              <span className='font-weight-bold'>{item.name}</span>
            </td>
            <td>{item.quantity.toLocaleString()}</td>
            <td>{item.unitPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</td>
            <td>{item.totalAmount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</td>
            <td>{moment(item.createdAt).format('ll')}</td>
            <td>
              <Badge color={item.status === 'received' ? 'light-success' : item.status === 'pending' ? 'light-warning' : 'light-danger'} pill>
                {item.status}
              </Badge>
            </td>
          </tr>
        )
      })
    } else {
      return (
        <tr>
          <td colSpan='6' className='text-center'>No supply history found</td>
        </tr>
      )
    }
  }

  // ** Calculate remaining balance
  const calculateRemainingBalance = () => {
    if (!selectedSupply) return 0
    const totalAmount = parseFloat(selectedSupply.totalAmount || 0)
    const amountPaid = parseFloat(selectedSupply.amountPaid || 0)
    return totalAmount - amountPaid
  }

  // ** Render Supply Details
  const renderSupplyDetails = () => {
    if (!selectedSupply) return <p>No details available</p>

    const remainingBalance = calculateRemainingBalance()

    return (
      <div className="supply-details">
        <h5 className="mb-2">Supply Information</h5>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Product:</Col>
          <Col xs="6" md="8">{selectedSupply.name || 'N/A'}</Col>
        </Row>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Quantity:</Col>
          <Col xs="6" md="8">{selectedSupply.quantity?.toLocaleString() || 'N/A'}</Col>
        </Row>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Unit Price:</Col>
          <Col xs="6" md="8">{selectedSupply.unitPrice?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) || 'N/A'}</Col>
        </Row>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Total Amount:</Col>
          <Col xs="6" md="8">{selectedSupply.totalAmount?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) || 'N/A'}</Col>
        </Row>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Supply Date:</Col>
          <Col xs="6" md="8">{selectedSupply.createdAt ? moment(selectedSupply.createdAt).format('lll') : 'N/A'}</Col>
        </Row>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Status:</Col>
          <Col xs="6" md="8">
            <Badge color={selectedSupply.status === 'received' ? 'light-success' : selectedSupply.status === 'pending' ? 'light-warning' : 'light-danger'} pill>
              {selectedSupply.status || 'N/A'}
            </Badge>
          </Col>
        </Row>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Notes:</Col>
          <Col xs="6" md="8">{selectedSupply.notes || 'N/A'}</Col>
        </Row>

        <h5 className="mt-3 mb-2">Payment Information</h5>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Payment Status:</Col>
          <Col xs="6" md="8">
            <Badge color={
              selectedSupply.paymentStatus === 'paid' ? 'light-success' : selectedSupply.paymentStatus === 'partial' ? 'light-warning' : 'light-danger'
            } pill>
              {selectedSupply.paymentStatus || 'N/A'}
            </Badge>
          </Col>
        </Row>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Payment Method:</Col>
          <Col xs="6" md="8">{selectedSupply.paymentMethod || 'N/A'}</Col>
        </Row>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Amount Paid:</Col>
          <Col xs="6" md="8">{selectedSupply.amountPaid?.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }) || '₦0.00'}</Col>
        </Row>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Remaining Balance:</Col>
          <Col xs="6" md="8" className={remainingBalance > 0 ? 'text-danger' : 'text-success'}>
            {remainingBalance.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
          </Col>
        </Row>
        <Row className="mb-2">
          <Col xs="6" md="4" className="font-weight-bold">Payment Due Date:</Col>
          <Col xs="6" md="8">{selectedSupply.paymentDueDate ? moment(selectedSupply.paymentDueDate).format('ll') : 'N/A'}</Col>
        </Row>

        {/* Payment History Table */}
        {selectedSupply.supplyPayments && selectedSupply.supplyPayments.length > 0 && (
          <div className="mt-3">
            <h5 className="mb-2">Payment History</h5>
            <Table responsive striped size="sm" className="border">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Processed By</th>
                </tr>
              </thead>
              <tbody>
                {selectedSupply.supplyPayments.map((payment, index) => (
                  <tr key={`payment-${payment.id || index}`}>
                    <td>{moment(payment.paymentDate).format('ll')}</td>
                    <td>{payment.amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</td>
                    <td>
                      <Badge color="light-primary" pill>
                        {payment.paymentMethod.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </td>
                    <td>
                      <small>{payment.reference}</small>
                    </td>
                    <td>
                      {payment.admin ? `${payment.admin.firstName} ${payment.admin.lastName}` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="1" className="text-right">Total Paid:</th>
                  <th colSpan="4">
                    {selectedSupply.supplyPayments.reduce((total, payment) => total + parseFloat(payment.amount), 0)
                      .toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                  </th>
                </tr>
              </tfoot>
            </Table>
          </div>
        )}

        {selectedSupply.notes && (
          <>
            <h5 className="mt-3 mb-2">Notes</h5>
            <p>{selectedSupply.notes}</p>
          </>
        )}

        {/* Payment Button */}
        {remainingBalance > 0 && selectedSupply.status !== 'cancelled' && (
          <Row className="mt-3">
            <Col>
              <Button color="primary" block onClick={togglePaymentModal}>
                <span>Make Payment</span>
              </Button>
            </Col>
          </Row>
        )}
      </div>
    )
  }

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>Supply History</CardTitle>
        </CardHeader>
        <CardBody>
          <Row>
            <Col sm='12'>
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Amount</th>
                    <th>Supply Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>{renderSupplyHistory()}</tbody>
              </Table>
              {store.selectedSupplier.supplies && store.selectedSupplier.supplies.length > 0 && (
                <p className="text-muted mt-1 small">
                  <i>Click on any row to view detailed information about the supply</i>
                </p>
              )}
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Supply Details Modal */}
      <Modal isOpen={modal} toggle={toggleModal} className='modal-dialog-centered modal-lg'>
        <ModalHeader toggle={toggleModal}>Supply Details</ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="text-center p-3">
              <Spinner color="primary" />
              <p className="mt-2">Loading supply details...</p>
            </div>
          ) : (
            renderSupplyDetails()
          )}
        </ModalBody>
        {!loading && selectedSupply && selectedSupply.status === 'pending' && (
          <ModalFooter>
            <Button 
              color="success" 
              onClick={() => updateSupplyStatus(selectedSupply.id, 'received')}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Spinner size="sm" color="white" className="mr-50" />
                  <span>Processing...</span>
                </>
              ) : (
                'Mark as Received'
              )}
            </Button>
            <Button 
              color="danger" 
              onClick={() => updateSupplyStatus(selectedSupply.id, 'cancelled')}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Spinner size="sm" color="white" className="mr-50" />
                  <span>Processing...</span>
                </>
              ) : (
                'Cancel Supply'
              )}
            </Button>
            <Button color="secondary" onClick={toggleModal}>
              Close
            </Button>
          </ModalFooter>
        )}
        {!loading && selectedSupply && selectedSupply.status !== 'pending' && (
          <ModalFooter>
            <Button color="secondary" onClick={toggleModal}>
              Close
            </Button>
          </ModalFooter>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={paymentModal} toggle={togglePaymentModal} className='modal-dialog-centered'>
        <ModalHeader toggle={togglePaymentModal}>Process Payment</ModalHeader>
        <ModalBody>
          {selectedSupply && (
            <Form onSubmit={processPayment}>
              <FormGroup>
                <Label for="paymentAmount">Payment Amount</Label>
                <Input
                  type="number"
                  id="paymentAmount"
                  placeholder="Enter payment amount"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                />
                <small className="text-muted">
                  Remaining balance: {calculateRemainingBalance().toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                </small>
              </FormGroup>
              <FormGroup>
                <Label for="paymentMethod">Payment Method</Label>
                <Input
                  type="select"
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="bank-transfer">Bank Transfer</option>
                </Input>
              </FormGroup>
              <div className="d-flex justify-content-end mt-2">
                <Button color="secondary" className="mr-1" onClick={togglePaymentModal} outline>
                  Cancel
                </Button>
                <Button color="primary" type="submit" disabled={processingPayment}>
                  {processingPayment ? (
                    <>
                      <Spinner size="sm" color="white" className="mr-50" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Process Payment'
                  )}
                </Button>
              </div>
            </Form>
          )}
        </ModalBody>
      </Modal>
    </Fragment>
  )
}

export default SupplyHistory 