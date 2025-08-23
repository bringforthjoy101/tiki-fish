import { useState } from 'react'
import { Card, CardBody, CardTitle, Button, Input, Badge } from 'reactstrap'
import { Edit3, Save, X, FileText, Plus } from 'react-feather'
import { swal, apiRequest } from '@utils'
import { useDispatch } from 'react-redux'
import { getOrder } from '../store/action'
import moment from 'moment'

const OrderNotes = ({ order }) => {
	const dispatch = useDispatch()
	const [isEditing, setIsEditing] = useState(false)
	const [notes, setNotes] = useState(order.notes || '')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSaveNotes = async () => {
		const body = JSON.stringify({ notes })
		try {
			setIsSubmitting(true)
			const response = await apiRequest({ 
				url: `/orders/update-notes/${order.id}`, 
				method: 'POST', 
				body 
			}, dispatch)
			
			if (response) {
				if (response.data.message) {
					swal('Success!', 'Notes updated successfully', 'success')
					dispatch(getOrder(order.id))
					setIsEditing(false)
				} else {
					swal('Oops!', response.data.message || 'Failed to update notes', 'error')
				}
			} else {
				swal('Oops!', 'Something went wrong with your network.', 'error')
			}
			setIsSubmitting(false)
		} catch (error) {
			console.error({ error })
			setIsSubmitting(false)
			swal('Error!', 'Failed to update notes', 'error')
		}
	}

	const handleCancel = () => {
		setNotes(order.notes || '')
		setIsEditing(false)
	}

	// Parse existing notes if they're in JSON format
	let notesHistory = []
	try {
		if (order.notesHistory) {
			notesHistory = JSON.parse(order.notesHistory)
		}
	} catch (e) {
		// If not JSON, treat as plain text
		if (order.notes) {
			notesHistory = [
				{
					text: order.notes,
					date: order.updatedAt,
					type: 'general'
				}
			]
		}
	}

	return (
		<Card>
			<CardBody>
				<div className="d-flex justify-content-between align-items-center mb-1">
					<CardTitle tag="h4" className="mb-0">
						<FileText size={20} className="me-50" />
						Order Notes
					</CardTitle>
					{!isEditing && (
						<Button 
							color="primary" 
							size="sm" 
							onClick={() => setIsEditing(true)}
						>
							<Plus size={14} className="me-25" />
							Add Note
						</Button>
					)}
				</div>

				{isEditing ? (
					<div>
						<Input
							type="textarea"
							rows="4"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Enter order notes..."
							className="mb-1"
						/>
						<div className="d-flex gap-1">
							<Button 
								color="success" 
								size="sm" 
								onClick={handleSaveNotes}
								disabled={isSubmitting}
							>
								<Save size={14} className="me-25" />
								Save
							</Button>
							<Button 
								color="secondary" 
								size="sm" 
								outline
								onClick={handleCancel}
								disabled={isSubmitting}
							>
								<X size={14} className="me-25" />
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<div>
						{notesHistory.length > 0 ? (
							<div className="notes-history">
								{notesHistory.map((note, index) => (
									<div key={index} className="note-item mb-1 p-1 border-start border-2 ps-2">
										<div className="d-flex justify-content-between align-items-start">
											<div className="flex-grow-1">
												<p className="mb-0">{note.text}</p>
												<small className="text-muted">
													{note.date ? moment(note.date).format('LLL') : 'No date'}
												</small>
											</div>
											{note.type && (
												<Badge color={note.type === 'status' ? 'warning' : note.type === 'payment' ? 'info' : 'secondary'}>
													{note.type}
												</Badge>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-2">
								<p className="text-muted mb-0">No notes added yet</p>
								<Button 
									color="link" 
									size="sm"
									onClick={() => setIsEditing(true)}
								>
									<Edit3 size={14} className="me-25" />
									Add the first note
								</Button>
							</div>
						)}
					</div>
				)}

				{/* Display any special notes */}
				{order.statusReason && (
					<div className="mt-2">
						<div className="alert alert-info mb-0">
							<h6 className="alert-heading">Status Change Reason</h6>
							<div className="alert-body">
								{order.statusReason}
							</div>
						</div>
					</div>
				)}

				{order.paymentNotes && (
					<div className="mt-2">
						<div className="alert alert-primary mb-0">
							<h6 className="alert-heading">Payment Notes</h6>
							<div className="alert-body">
								{order.paymentNotes}
							</div>
						</div>
					</div>
				)}
			</CardBody>
		</Card>
	)
}

export default OrderNotes