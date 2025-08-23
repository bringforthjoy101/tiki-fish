import { Card, CardBody, CardTitle } from 'reactstrap'
import { Clock, Check, X, Package, Truck, Home, AlertCircle, RefreshCw, Pause } from 'react-feather'
import moment from 'moment'

const OrderTimeline = ({ order }) => {
	// Define status flow
	const statusFlow = [
		{ 
			status: 'pending', 
			label: 'Order Placed', 
			icon: Clock, 
			color: 'secondary',
			description: 'Order received and pending processing'
		},
		{ 
			status: 'processing', 
			label: 'Processing', 
			icon: Package, 
			color: 'warning',
			description: 'Order is being prepared'
		},
		{ 
			status: 'ready', 
			label: 'Ready for Pickup', 
			icon: Check, 
			color: 'info',
			description: 'Order is ready for pickup/delivery'
		},
		{ 
			status: 'out_for_delivery', 
			label: 'Out for Delivery', 
			icon: Truck, 
			color: 'primary',
			description: 'Order is on the way'
		},
		{ 
			status: 'delivered', 
			label: 'Delivered', 
			icon: Home, 
			color: 'success',
			description: 'Order has been delivered'
		},
		{ 
			status: 'completed', 
			label: 'Completed', 
			icon: Check, 
			color: 'success',
			description: 'Order completed successfully'
		}
	]

	// Special statuses
	const specialStatuses = {
		cancelled: { label: 'Cancelled', icon: X, color: 'danger' },
		refunded: { label: 'Refunded', icon: RefreshCw, color: 'dark' },
		on_hold: { label: 'On Hold', icon: Pause, color: 'warning' }
	}

	// Get current status index
	const currentStatusIndex = statusFlow.findIndex(s => s.status === order.status)
	const isSpecialStatus = specialStatuses[order.status] !== undefined

	const getStatusIcon = (status) => {
		const StatusIcon = status.icon
		return <StatusIcon size={20} />
	}

	const renderTimeline = () => {
		if (isSpecialStatus) {
			// Show special status separately
			const specialStatus = specialStatuses[order.status]
			return (
				<div className="timeline">
					<div className="timeline-item">
						<div className={`timeline-point timeline-point-${specialStatus.color}`}>
							{getStatusIcon(specialStatus)}
						</div>
						<div className="timeline-event">
							<h6 className="mb-0">{specialStatus.label}</h6>
							<p className="mb-0">
								<small className="text-muted">
									{order.updatedAt ? moment(order.updatedAt).format('LLL') : 'Recently'}
								</small>
							</p>
							{order.statusReason && (
								<p className="mb-0 mt-50">
									<small><strong>Reason:</strong> {order.statusReason}</small>
								</p>
							)}
						</div>
					</div>
				</div>
			)
		}

		return (
			<div className="timeline">
				{statusFlow.map((status, index) => {
					const isCompleted = index <= currentStatusIndex
					const isCurrent = index === currentStatusIndex
					const StatusIcon = status.icon

					return (
						<div key={status.status} className="timeline-item">
							<div 
								className={`timeline-point ${isCompleted ? `timeline-point-${status.color}` : 'timeline-point-secondary'} ${isCurrent ? 'timeline-point-indicator' : ''}`}
							>
								{isCompleted ? (
									<StatusIcon size={16} />
								) : (
									<span className="timeline-point-indicator-empty"></span>
								)}
							</div>
							<div className="timeline-event">
								<div className="d-flex justify-content-between">
									<h6 className={`mb-0 ${!isCompleted ? 'text-muted' : ''}`}>
										{status.label}
									</h6>
									{isCurrent && (
										<span className="badge badge-light-primary">Current</span>
									)}
								</div>
								<p className="mb-0">
									<small className="text-muted">{status.description}</small>
								</p>
								{isCurrent && order.updatedAt && (
									<p className="mb-0">
										<small className="text-muted">
											{moment(order.updatedAt).format('LLL')}
										</small>
									</p>
								)}
								{isCurrent && order.statusReason && (
									<p className="mb-0 mt-50">
										<small><strong>Note:</strong> {order.statusReason}</small>
									</p>
								)}
							</div>
						</div>
					)
				})}
			</div>
		)
	}

	return (
		<Card>
			<CardBody>
				<CardTitle tag="h4" className="mb-1">
					<AlertCircle size={20} className="me-50" />
					Order Timeline
				</CardTitle>
				{renderTimeline()}
			</CardBody>
		</Card>
	)
}

export default OrderTimeline