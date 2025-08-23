import { useState } from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Label, Input, Form } from 'reactstrap'
import { selectThemeColors, swal, apiRequest } from '@utils'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import { getOrder } from '../store/action'
import Select from 'react-select'

export const UpdatePayment = ({ currentPaymentMode, currentPaymentStatus }) => {
	const dispatch = useDispatch()
	const { id } = useParams()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [paymentMode, setPaymentMode] = useState(null)
	const [paymentStatus, setPaymentStatus] = useState(null)
	const [transactionId, setTransactionId] = useState('')
	const [notes, setNotes] = useState('')

	const [modal, setModal] = useState(false)

	const toggleModal = () => {
		setModal(!modal)
		// Reset form when closing
		if (modal) {
			setPaymentMode(null)
			setPaymentStatus(null)
			setTransactionId('')
			setNotes('')
		}
	}

	const onSubmit = async (event) => {
		event?.preventDefault()
		
		if (!paymentMode && !paymentStatus) {
			swal('Error!', 'Please select at least one field to update', 'error')
			return
		}

		const updateData = {}
		if (paymentMode) updateData.paymentMode = paymentMode.value
		if (paymentStatus) updateData.paymentStatus = paymentStatus.value
		if (transactionId) updateData.transactionId = transactionId
		if (notes) updateData.notes = notes

		const body = JSON.stringify(updateData)
		try {
			setIsSubmitting(true)
			const response = await apiRequest({ url: `/orders/update-payment/${id}`, method: 'POST', body }, dispatch)
			if (response) {
				if (response.data.message) {
					swal('Great job!', response.data.message, 'success')
					dispatch(getOrder(id))
					setIsSubmitting(false)
					toggleModal()
				} else {
					swal('Oops!', response.data.message || 'Something went wrong', 'error')
					setIsSubmitting(false)
				}
			} else {
				swal('Oops!', 'Something went wrong with your network.', 'error')
				setIsSubmitting(false)
			}
		} catch (error) {
			console.error({ error })
			setIsSubmitting(false)
		}
	}

	const PaymentModeOptions = [
		{ value: 'cash', label: 'Cash', icon: '💵' },
		{ value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
		{ value: 'pos', label: 'POS', icon: '💳' },
		{ value: 'online', label: 'Online Payment', icon: '💻' },
		{ value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
		{ value: 'cheque', label: 'Cheque', icon: '📝' }
	]

	const PaymentStatusOptions = [
		{ value: 'pending', label: 'Pending', color: 'warning', description: 'Payment not yet received' },
		{ value: 'paid', label: 'Paid', color: 'success', description: 'Payment received in full' },
		{ value: 'partial', label: 'Partially Paid', color: 'info', description: 'Partial payment received' },
		{ value: 'failed', label: 'Failed', color: 'danger', description: 'Payment attempt failed' },
		{ value: 'refunded', label: 'Refunded', color: 'secondary', description: 'Payment has been refunded' }
	]

	return (
		<>
			<Button.Ripple color="info" onClick={toggleModal} block className="mb-75">
				Update Payment
			</Button.Ripple>
			<Modal isOpen={modal} toggle={toggleModal} className="modal-dialog-centered modal-lg">
				<ModalHeader toggle={toggleModal}>Update Payment Details</ModalHeader>
				<Form onSubmit={onSubmit}>
					<ModalBody>
						<div className="row">
							<div className="col-md-6">
								<div className="mb-1">
									<Label className="form-label">Current Payment Mode</Label>
									<div className="alert alert-light">
										<strong>{currentPaymentMode ? currentPaymentMode.toUpperCase() : 'Not Set'}</strong>
									</div>
								</div>
							</div>
							<div className="col-md-6">
								<div className="mb-1">
									<Label className="form-label">Current Payment Status</Label>
									<div className="alert alert-light">
										<strong>{currentPaymentStatus ? currentPaymentStatus.toUpperCase() : 'PENDING'}</strong>
									</div>
								</div>
							</div>
						</div>
						
						<div className="row">
							<div className="col-md-6">
								<div className="mb-1">
									<Label className="form-label" for="paymentMode">
										Payment Mode
									</Label>
									<Select
										id="paymentMode"
										name="paymentMode"
										theme={selectThemeColors}
										className="react-select"
										classNamePrefix="select"
										options={PaymentModeOptions}
										value={paymentMode}
										onChange={setPaymentMode}
										isClearable={true}
										formatOptionLabel={(option) => (
											<div className="d-flex align-items-center">
												<span className="me-2">{option.icon}</span>
												<span>{option.label}</span>
											</div>
										)}
										placeholder="Select payment mode..."
									/>
								</div>
							</div>
							<div className="col-md-6">
								<div className="mb-1">
									<Label className="form-label" for="paymentStatus">
										Payment Status
									</Label>
									<Select
										id="paymentStatus"
										name="paymentStatus"
										theme={selectThemeColors}
										className="react-select"
										classNamePrefix="select"
										options={PaymentStatusOptions}
										value={paymentStatus}
										onChange={setPaymentStatus}
										isClearable={true}
										formatOptionLabel={(option) => (
											<div>
												<div className="fw-bold">{option.label}</div>
												{option.description && (
													<small className="text-muted">{option.description}</small>
												)}
											</div>
										)}
										placeholder="Select payment status..."
									/>
								</div>
							</div>
						</div>

						<div className="mb-1">
							<Label className="form-label" for="transactionId">
								Transaction ID / Reference (Optional)
							</Label>
							<Input
								type="text"
								id="transactionId"
								name="transactionId"
								value={transactionId}
								onChange={(e) => setTransactionId(e.target.value)}
								placeholder="Enter transaction reference number..."
							/>
						</div>

						<div className="mb-1">
							<Label className="form-label" for="notes">
								Payment Notes (Optional)
							</Label>
							<Input
								type="textarea"
								id="notes"
								name="notes"
								rows="3"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Enter any payment related notes..."
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color="secondary" onClick={toggleModal} outline>
							Cancel
						</Button>
						<Button 
							className="ms-1" 
							color="info" 
							type="submit"
							disabled={isSubmitting || (!paymentMode && !paymentStatus)}
						>
							{isSubmitting && <Spinner color="white" size="sm" className="me-1" />}
							Update Payment
						</Button>
					</ModalFooter>
				</Form>
			</Modal>
		</>
	)
}

export default UpdatePayment