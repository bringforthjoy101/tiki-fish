import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardTitle, Button, Badge, Label, Input, Spinner } from 'reactstrap'
import { selectThemeColors, swal, apiRequest } from '@utils'
import { useDispatch } from 'react-redux'
import Select from 'react-select'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import moment from 'moment/moment'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {
	Package,
	CreditCard,
	Truck,
	DollarSign,
	Download,
	Printer,
	XCircle,
	CheckCircle,
	Clock,
	AlertCircle
} from 'react-feather'
import { getOrder } from '../store/action'

const FulfillmentPanel = ({ id, data }) => {
	const dispatch = useDispatch()
	const MySwal = withReactContent(Swal)

	// Order status state
	const [selectedStatus, setSelectedStatus] = useState(null)
	const [statusReason, setStatusReason] = useState('')
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

	// Payment status state
	const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(null)
	const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)

	// Delivery fee state
	const [deliveryFee, setDeliveryFee] = useState('')
	const [isUpdatingFee, setIsUpdatingFee] = useState(false)

	const isOrderFinalized = data.status === 'completed' || data.status === 'cancelled'

	const statusObj = {
		pending: 'light-secondary',
		processing: 'light-warning',
		ready: 'light-primary',
		out_for_delivery: 'light-info',
		delivered: 'light-info',
		completed: 'light-success',
		cancelled: 'light-danger',
		failed: 'light-danger',
		refunded: 'light-dark',
		on_hold: 'light-warning'
	}

	const paymentStatusObj = {
		pending: 'light-warning',
		processing: 'light-info',
		paid: 'light-success',
		partial: 'light-primary',
		success: 'light-success',
		failed: 'light-danger',
		cancelled: 'light-secondary',
		refunded: 'light-dark'
	}

	const StatusOptions = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'processing', label: 'Processing' },
		{ value: 'ready', label: 'Ready for Pickup' },
		{ value: 'out_for_delivery', label: 'Out for Delivery' },
		{ value: 'delivered', label: 'Delivered' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'cancelled', label: 'Cancelled' },
		{ value: 'refunded', label: 'Refunded' },
		{ value: 'on_hold', label: 'On Hold' }
	]

	const PaymentStatusOptions = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'paid', label: 'Paid' },
		{ value: 'partial', label: 'Partially Paid' },
		{ value: 'failed', label: 'Failed' },
		{ value: 'refunded', label: 'Refunded' }
	]

	// Filter out current values
	const availableStatusOptions = StatusOptions.filter(opt => opt.value !== data.status)
	const availablePaymentOptions = PaymentStatusOptions.filter(opt => opt.value !== (data.paymentStatus || 'pending'))

	// ── Order Status Update ──
	const handleUpdateStatus = async () => {
		if (!selectedStatus) {
			swal('Error!', 'Please select a status', 'error')
			return
		}

		const body = JSON.stringify({
			order_status: selectedStatus.value,
			...(statusReason && { reason: statusReason })
		})

		try {
			setIsUpdatingStatus(true)
			const response = await apiRequest({ url: `/shop/orders/${id}/status`, method: 'PUT', body }, dispatch)
			if (response && response.data.status) {
				swal('Great job!', response.data.message || 'Order status updated', 'success')
				dispatch(getOrder(id))
				setSelectedStatus(null)
				setStatusReason('')
			} else {
				swal('Oops!', response?.data?.message || 'Failed to update status', 'error')
			}
		} catch (error) {
			console.error('Update status error:', error)
			swal('Oops!', 'Something went wrong with your network.', 'error')
		} finally {
			setIsUpdatingStatus(false)
		}
	}

	// ── Payment Status Update ──
	const handleUpdatePayment = async () => {
		if (!selectedPaymentStatus) {
			swal('Error!', 'Please select a payment status', 'error')
			return
		}

		const body = JSON.stringify({
			payment_status: selectedPaymentStatus.value
		})

		try {
			setIsUpdatingPayment(true)
			const response = await apiRequest({ url: `/shop/orders/${id}/status`, method: 'PUT', body }, dispatch)
			if (response && response.data.status) {
				swal('Great job!', response.data.message || 'Payment status updated', 'success')
				dispatch(getOrder(id))
				setSelectedPaymentStatus(null)
			} else {
				swal('Oops!', response?.data?.message || 'Failed to update payment', 'error')
			}
		} catch (error) {
			console.error('Update payment error:', error)
			swal('Oops!', 'Something went wrong with your network.', 'error')
		} finally {
			setIsUpdatingPayment(false)
		}
	}

	// ── Delivery Fee Update ──
	const handleUpdateDeliveryFee = async () => {
		const feeValue = Number(deliveryFee)
		if (isNaN(feeValue) || feeValue < 0) {
			swal('Error!', 'Please enter a valid delivery fee', 'error')
			return
		}

		const body = JSON.stringify({ deliveryFee: feeValue })

		try {
			setIsUpdatingFee(true)
			const response = await apiRequest({ url: `/shop/orders/${id}/delivery-fee`, method: 'PUT', body }, dispatch)
			if (response && response.data.status) {
				swal('Great job!', response.data.message || 'Delivery fee updated', 'success')
				dispatch(getOrder(id))
				setDeliveryFee('')
			} else {
				swal('Oops!', response?.data?.message || 'Failed to update delivery fee', 'error')
			}
		} catch (error) {
			console.error('Update delivery fee error:', error)
			swal('Oops!', 'Something went wrong with your network.', 'error')
		} finally {
			setIsUpdatingFee(false)
		}
	}

	// ── Cancel Order ──
	const handleCancelOrder = async () => {
		return MySwal.fire({
			title: 'Are you sure?',
			text: 'This action will cancel this order and restore inventory!',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, cancel it!',
			customClass: {
				confirmButton: 'btn btn-danger',
				cancelButton: 'btn btn-outline-danger ml-1'
			},
			buttonsStyling: false
		}).then(async function (result) {
			if (result.value) {
				try {
					const body = JSON.stringify({ order_status: 'cancelled' })
					const response = await apiRequest({ url: `/shop/orders/${id}/status`, method: 'PUT', body }, dispatch)
					if (response && response.data.status) {
						dispatch(getOrder(id))
						MySwal.fire({
							icon: 'success',
							title: 'Cancelled!',
							text: 'Order has been cancelled.',
							customClass: {
								confirmButton: 'btn btn-primary'
							}
						})
					} else {
						swal('Oops!', response?.data?.message || 'Failed to cancel order', 'error')
					}
				} catch (error) {
					console.error('Cancel order error:', error)
					swal('Oops!', 'Something went wrong with your network.', 'error')
				}
			}
		})
	}

	// ── Download Receipt (PDF) ──
	const handleDownloadOrder = () => {
		const doc = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: [80, 297]
		})

		doc.setFont('courier', 'normal')
		doc.setFontSize(8)

		let yPos = 10
		const lineHeight = 3.5
		const pageWidth = 80
		const margin = 5
		const contentWidth = pageWidth - (margin * 2)

		const centerText = (text, y, fontSize = 8) => {
			doc.setFontSize(fontSize)
			const textWidth = doc.getTextWidth(text)
			doc.text(text, (pageWidth - textWidth) / 2, y)
		}

		const drawLine = (y, style = 'dashed') => {
			if (style === 'dashed') {
				doc.setLineDashPattern([1, 1], 0)
			} else {
				doc.setLineDashPattern([], 0)
			}
			doc.line(margin, y, pageWidth - margin, y)
			doc.setLineDashPattern([], 0)
			return y + 2
		}

		// Company Header
		doc.setFont('courier', 'bold')
		centerText('TIKI FISH FARM', yPos, 11)
		yPos += lineHeight + 1

		doc.setFont('courier', 'normal')
		centerText('& SMOKE HOUSE', yPos, 8)
		yPos += lineHeight

		centerText('500m Opp. Ilere Junction', yPos, 7)
		yPos += lineHeight
		centerText('Along Ijare Road, Akure South', yPos, 7)
		yPos += lineHeight
		centerText('Ondo State, Nigeria', yPos, 7)
		yPos += lineHeight + 2

		doc.setFont('courier', 'bold')
		centerText('SALES RECEIPT', yPos, 9)
		yPos += lineHeight + 2

		yPos = drawLine(yPos)
		yPos += 2

		// Order Information
		doc.setFont('courier', 'normal')
		doc.setFontSize(7)
		doc.text(`Order No: #${data.orderNumber}`, margin, yPos)
		yPos += lineHeight
		doc.text(`Date: ${moment(data.createdAt).format('DD/MM/YYYY HH:mm')}`, margin, yPos)
		yPos += lineHeight
		doc.text(`Status: ${data.status.toUpperCase()}`, margin, yPos)
		yPos += lineHeight
		doc.text(`Payment: ${data.paymentMode.toUpperCase()}`, margin, yPos)
		yPos += lineHeight + 1

		// Customer Info
		yPos = drawLine(yPos)
		yPos += 2
		doc.text(`Customer: ${data.customer.fullName}`, margin, yPos)
		yPos += lineHeight
		doc.text(`Phone: ${data.customer.phone}`, margin, yPos)
		yPos += lineHeight
		if (data.location) {
			const locationLines = doc.splitTextToSize(`Location: ${data.location}`, contentWidth)
			locationLines.forEach(line => {
				doc.text(line, margin, yPos)
				yPos += lineHeight
			})
		}
		yPos += 1

		// Products Header
		yPos = drawLine(yPos)
		yPos += 2
		doc.setFont('courier', 'bold')
		doc.text('ITEM', margin, yPos)
		doc.text('AMT', pageWidth - margin - 15, yPos)
		yPos += lineHeight
		doc.setFont('courier', 'normal')

		// Products
		data.products.forEach(product => {
			const nameLines = doc.splitTextToSize(product.name, contentWidth - 20)
			nameLines.forEach((line, index) => {
				if (index === 0) {
					doc.text(line, margin, yPos)
					doc.text(`₦${product.amount.toLocaleString()}`, pageWidth - margin - doc.getTextWidth(`₦${product.amount.toLocaleString()}`), yPos)
				} else {
					doc.text(line, margin, yPos)
				}
				yPos += lineHeight
			})
			doc.setFontSize(6)
			doc.text(`  ${product.qty} x ₦${product.price.toLocaleString()}`, margin, yPos)
			doc.setFontSize(7)
			yPos += lineHeight + 0.5
		})

		// Totals
		yPos = drawLine(yPos)
		yPos += 2

		const drawTotal = (label, amount, bold = false) => {
			if (bold) doc.setFont('courier', 'bold')
			doc.text(label, margin, yPos)
			const amountText = `₦${amount.toLocaleString()}`
			doc.text(amountText, pageWidth - margin - doc.getTextWidth(amountText), yPos)
			if (bold) doc.setFont('courier', 'normal')
			yPos += lineHeight
		}

		drawTotal('Subtotal:', data.subTotal)
		if (data.logistics > 0) drawTotal('Logistics:', data.logistics)
		if (data.discount > 0) drawTotal('Discount:', -data.discount)

		yPos = drawLine(yPos, 'solid')
		yPos += 1
		doc.setFontSize(8)
		drawTotal('TOTAL:', data.amount, true)
		yPos += 2

		// Payment Status
		if (data.paymentStatus) {
			yPos = drawLine(yPos)
			yPos += 2
			doc.text(`Payment Status: ${data.paymentStatus.toUpperCase()}`, margin, yPos)
			yPos += lineHeight
		}

		// Attendant
		yPos = drawLine(yPos)
		yPos += 2
		doc.text(`Attendant: ${data.admin.firstName} ${data.admin.lastName}`, margin, yPos)
		yPos += lineHeight + 2

		// Footer
		yPos = drawLine(yPos)
		yPos += 2
		doc.setFont('courier', 'bold')
		centerText('THANK YOU!', yPos, 8)
		yPos += lineHeight
		doc.setFont('courier', 'normal')
		doc.setFontSize(6)
		centerText('Thanks for your patronage', yPos)
		yPos += lineHeight
		centerText('We hope to see you again', yPos)
		yPos += lineHeight + 2

		centerText(`*${data.orderNumber}*`, yPos, 8)

		doc.save(`receipt-${data.orderNumber}.pdf`)
	}

	// Computed preview for delivery fee
	const feeValue = Number(deliveryFee)
	const showFeePreview = deliveryFee !== '' && !isNaN(feeValue) && feeValue >= 0
	const previewTotal = showFeePreview ? (data.subTotal || 0) + feeValue - (data.discount || 0) : null

	return (
		<div>
			{/* Order Status Section */}
			<Card className="invoice-action-wrapper">
				<CardBody>
					<CardTitle tag="h6" className="mb-1">
						<Package size={16} className="mr-50" />
						Order Status
					</CardTitle>
					<div className="mb-1">
						<Badge color={statusObj[data.status] || 'light-secondary'} pill className="px-2 py-50">
							{data.status.toUpperCase()}
						</Badge>
					</div>
					{!isOrderFinalized && (
						<>
							<div className="mb-1">
								<Label className="form-label" for="orderStatus">New Status</Label>
								<Select
									id="orderStatus"
									theme={selectThemeColors}
									className="react-select"
									classNamePrefix="select"
									options={availableStatusOptions}
									value={selectedStatus}
									onChange={setSelectedStatus}
									isClearable
									placeholder="Select status..."
								/>
							</div>
							<div className="mb-1">
								<Label className="form-label" for="statusReason">Reason (Optional)</Label>
								<Input
									type="textarea"
									id="statusReason"
									rows="2"
									value={statusReason}
									onChange={(e) => setStatusReason(e.target.value)}
									placeholder="Enter reason..."
								/>
							</div>
							<Button.Ripple
								color="primary"
								block
								onClick={handleUpdateStatus}
								disabled={isUpdatingStatus || !selectedStatus}
							>
								{isUpdatingStatus && <Spinner color="white" size="sm" className="mr-50" />}
								Update Status
							</Button.Ripple>
						</>
					)}
				</CardBody>
			</Card>

			{/* Payment Status Section */}
			<Card className="invoice-action-wrapper">
				<CardBody>
					<CardTitle tag="h6" className="mb-1">
						<CreditCard size={16} className="mr-50" />
						Payment
					</CardTitle>
					<div className="mb-1 d-flex gap-50">
						<Badge color={paymentStatusObj[data.paymentStatus || 'pending'] || 'light-secondary'} pill className="px-2 py-50">
							{(data.paymentStatus || 'pending').toUpperCase()}
						</Badge>
						<Badge color="light-info" pill className="px-2 py-50">
							{data.paymentMode.toUpperCase()}
						</Badge>
					</div>
					{!isOrderFinalized && (
						<>
							<div className="mb-1">
								<Label className="form-label" for="paymentStatus">New Payment Status</Label>
								<Select
									id="paymentStatus"
									theme={selectThemeColors}
									className="react-select"
									classNamePrefix="select"
									options={availablePaymentOptions}
									value={selectedPaymentStatus}
									onChange={setSelectedPaymentStatus}
									isClearable
									placeholder="Select payment status..."
								/>
							</div>
							<Button.Ripple
								color="info"
								block
								onClick={handleUpdatePayment}
								disabled={isUpdatingPayment || !selectedPaymentStatus}
							>
								{isUpdatingPayment && <Spinner color="white" size="sm" className="mr-50" />}
								Update Payment
							</Button.Ripple>
						</>
					)}
				</CardBody>
			</Card>

			{/* Delivery Fee Section */}
			<Card className="invoice-action-wrapper">
				<CardBody>
					<CardTitle tag="h6" className="mb-1">
						<Truck size={16} className="mr-50" />
						Delivery Fee
					</CardTitle>
					<div className="mb-1">
						<small className="text-muted">Current Fee</small>
						<h5 className="mb-0">₦{(data.logistics || 0).toLocaleString()}</h5>
					</div>
					{!isOrderFinalized && (
						<>
							<div className="mb-1">
								<Label className="form-label" for="deliveryFee">New Delivery Fee (₦)</Label>
								<Input
									type="number"
									id="deliveryFee"
									min="0"
									value={deliveryFee}
									onChange={(e) => setDeliveryFee(e.target.value)}
									placeholder="Enter amount..."
								/>
							</div>
							{showFeePreview && (
								<div className="mb-1 p-1 bg-light rounded">
									<small className="text-muted d-block">New Total Preview</small>
									<small>₦{(data.subTotal || 0).toLocaleString()} + ₦{feeValue.toLocaleString()}{data.discount > 0 ? ` - ₦${data.discount.toLocaleString()}` : ''} = </small>
									<strong>₦{previewTotal.toLocaleString()}</strong>
								</div>
							)}
							<Button.Ripple
								color="warning"
								block
								onClick={handleUpdateDeliveryFee}
								disabled={isUpdatingFee || !showFeePreview}
							>
								{isUpdatingFee && <Spinner color="white" size="sm" className="mr-50" />}
								Update Fee
							</Button.Ripple>
						</>
					)}
				</CardBody>
			</Card>

			{/* Quick Actions */}
			<Card className="invoice-action-wrapper">
				<CardBody>
					<CardTitle tag="h6" className="mb-1">
						<CheckCircle size={16} className="mr-50" />
						Actions
					</CardTitle>
					<Button.Ripple
						className="mb-75"
						color="danger"
						outline
						onClick={handleCancelOrder}
						block
						disabled={isOrderFinalized}
					>
						<XCircle size={14} className="mr-50" />
						Cancel Order
					</Button.Ripple>
					<Button.Ripple
						className="mb-75"
						color="success"
						onClick={handleDownloadOrder}
						block
						outline
					>
						<Download size={14} className="mr-50" />
						Download Receipt
					</Button.Ripple>
					<Button.Ripple
						color="secondary"
						tag={Link}
						to={`/order/print/${id}`}
						block
						outline
					>
						<Printer size={14} className="mr-50" />
						Print
					</Button.Ripple>
				</CardBody>
			</Card>
		</div>
	)
}

export default FulfillmentPanel
