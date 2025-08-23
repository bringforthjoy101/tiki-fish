import { useState } from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Spinner, Label, Input, Form } from 'reactstrap'
import { selectThemeColors, swal, apiRequest } from '@utils'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import {
	getOrder,
	// updateStatus
} from '../store/action'
import Select from 'react-select'

export const UpdateStatus = ({ currentStatus }) => {
	const dispatch = useDispatch()
	const { id } = useParams()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [selectedStatus, setSelectedStatus] = useState(null)
	const [reason, setReason] = useState('')

	const [modal, setModal] = useState(false)

	const toggleModal = () => {
		setModal(!modal)
		// Reset form when closing
		if (modal) {
			setSelectedStatus(null)
			setReason('')
		}
	}

	const onSubmit = async (event) => {
		event?.preventDefault()
		
		if (!selectedStatus) {
			swal('Error!', 'Please select a status', 'error')
			return
		}

		const userData = {
			status: selectedStatus.value,
			reason: reason || undefined,
			previousStatus: currentStatus
		}
		const body = JSON.stringify(userData)
		try {
			setIsSubmitting(true)
			const response = await apiRequest({ url: `/orders/update-status/${id}`, method: 'POST', body }, dispatch)
			if (response) {
				if (response.data.message) {
					swal('Great job!', response.data.message, 'success')
					dispatch(getOrder(id))
					setIsSubmitting(false)
					toggleModal()
				} else {
					swal('Oops!', response.data.message, 'error')
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

	const StatusOptions = [
		{ value: 'pending', label: 'Pending', description: 'Order is awaiting processing' },
		{ value: 'processing', label: 'Processing', description: 'Order is being prepared' },
		{ value: 'ready', label: 'Ready for Pickup', description: 'Order is ready for customer pickup' },
		{ value: 'out_for_delivery', label: 'Out for Delivery', description: 'Order is on the way to customer' },
		{ value: 'delivered', label: 'Delivered', description: 'Order has been delivered to customer' },
		{ value: 'completed', label: 'Completed', description: 'Order has been successfully completed' },
		{ value: 'cancelled', label: 'Cancelled', description: 'Order has been cancelled' },
		{ value: 'refunded', label: 'Refunded', description: 'Order has been refunded' },
		{ value: 'on_hold', label: 'On Hold', description: 'Order is temporarily on hold' }
	]

	// Filter out current status from options
	const availableOptions = StatusOptions.filter(option => option.value !== currentStatus)

	return (
		<>
			<Button.Ripple color="primary" onClick={toggleModal} block className="mb-75">
				Update Status
			</Button.Ripple>
			<Modal isOpen={modal} toggle={toggleModal} className="modal-dialog-centered modal-lg">
				<ModalHeader toggle={toggleModal}>Update Order Status</ModalHeader>
				<Form onSubmit={onSubmit}>
					<ModalBody>
						{currentStatus && (
							<div className="mb-1">
								<Label className="form-label">Current Status</Label>
								<div className="alert alert-info">
									<strong>{currentStatus.toUpperCase()}</strong>
								</div>
							</div>
						)}
						<div className="mb-1">
							<Label className="form-label" for="status">
								New Status <span className="text-danger">*</span>
							</Label>
							<Select
								id="status"
								name="status"
								theme={selectThemeColors}
								className="react-select"
								classNamePrefix="select"
								options={availableOptions}
								value={selectedStatus}
								onChange={setSelectedStatus}
								isClearable={false}
								formatOptionLabel={(option) => (
									<div>
										<div className="fw-bold">{option.label}</div>
										{option.description && (
											<small className="text-muted">{option.description}</small>
										)}
									</div>
								)}
								placeholder="Select new status..."
							/>
						</div>
						<div className="mb-1">
							<Label className="form-label" for="reason">
								Reason / Notes (Optional)
							</Label>
							<Input
								type="textarea"
								id="reason"
								name="reason"
								rows="3"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								placeholder="Enter reason for status change or any notes..."
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button color="secondary" onClick={toggleModal} outline>
							Cancel
						</Button>
						<Button 
							className="ms-1" 
							color="primary" 
							type="submit"
							disabled={isSubmitting || !selectedStatus}
						>
							{isSubmitting && <Spinner color="white" size="sm" className="me-1" />}
							Update Status
						</Button>
					</ModalFooter>
				</Form>
			</Modal>
		</>
	)
}

export default UpdateStatus
