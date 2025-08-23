// ** React Imports
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import moment from 'moment'
import { getOrder } from '../store/action'
import { isUserLoggedIn } from '@utils'
import SpinnerComponent from '@src/@core/components/spinner/Loading-spinner'

// ** Styles
import '@styles/base/pages/thermal-print.scss'

const Print = () => {
	const store = useSelector((state) => state.orders)
	const dispatch = useDispatch()
	const { id } = useParams()
	const userData = JSON.parse(localStorage.getItem('userData'))
	const { selectedOrder } = store

	useEffect(() => {
		dispatch(getOrder(id))
	}, [dispatch, id])

	useEffect(() => {
		if (selectedOrder) {
			// Delay print to ensure content is rendered
			setTimeout(() => {
				window.print()
			}, 500)
		}
	}, [selectedOrder])

	const formatCurrency = (amount) => {
		return `₦${amount?.toLocaleString() || '0'}`
	}

	const renderProducts = (products) => {
		if (!products) return null
		
		return products.map((product, index) => (
			<tr key={product.id || index}>
				<td>
					<div className="product-name">{product.name}</div>
					<div className="product-details">
						{product.qty} x {formatCurrency(product.price)}
					</div>
				</td>
				<td className="text-right">{formatCurrency(product.amount)}</td>
			</tr>
		))
	}

	const getStatusDisplay = (status) => {
		const statusMap = {
			pending: 'PENDING',
			processing: 'PROCESSING',
			ready: 'READY',
			delivered: 'DELIVERED',
			completed: 'COMPLETED',
			cancelled: 'CANCELLED'
		}
		return statusMap[status] || status?.toUpperCase()
	}

	const getPaymentStatusDisplay = (status) => {
		const statusMap = {
			pending: 'PENDING',
			paid: 'PAID',
			partial: 'PARTIAL',
			failed: 'FAILED'
		}
		return statusMap[status] || status?.toUpperCase()
	}

	if (!selectedOrder) {
		return <SpinnerComponent />
	}

	return (
		<div className="thermal-receipt-preview">
			<div className="thermal-receipt">
				{/* Header Section */}
				<div className="receipt-header">
					<h1 className="company-name">TIKI FISH FARM</h1>
					<div className="company-info">& SMOKE HOUSE</div>
					<div className="company-info">500m Opp. Ilere Junction</div>
					<div className="company-info">Along Ijare Road, Akure South</div>
					<div className="company-info">Ondo State, Nigeria</div>
					<div className="company-info">Tel: +234 XXX XXX XXXX</div>
					<div className="receipt-title mt-2">SALES RECEIPT</div>
				</div>

				<hr className="receipt-divider" />

				{/* Order Information */}
				<div className="receipt-info">
					<div className="info-row">
						<span className="info-label">Order No:</span>
						<span className="info-value">#{selectedOrder.orderNumber || selectedOrder.saleNumber}</span>
					</div>
					<div className="info-row">
						<span className="info-label">Date:</span>
						<span className="info-value">{moment(selectedOrder.createdAt).format('DD/MM/YYYY')}</span>
					</div>
					<div className="info-row">
						<span className="info-label">Time:</span>
						<span className="info-value">{moment(selectedOrder.createdAt).format('HH:mm:ss')}</span>
					</div>
					<div className="info-row">
						<span className="info-label">Status:</span>
						<span className="info-value">{getStatusDisplay(selectedOrder.status)}</span>
					</div>
					<div className="info-row">
						<span className="info-label">Payment:</span>
						<span className="info-value">{selectedOrder.paymentMode?.toUpperCase()}</span>
					</div>
					{selectedOrder.paymentStatus && (
						<div className="info-row">
							<span className="info-label">Pay Status:</span>
							<span className="info-value">{getPaymentStatusDisplay(selectedOrder.paymentStatus)}</span>
						</div>
					)}
				</div>

				<hr className="receipt-divider" />

				{/* Customer Information */}
				<div className="receipt-info">
					<div className="info-row">
						<span className="info-label">Customer:</span>
						<span className="info-value">{selectedOrder.customer?.fullName}</span>
					</div>
					<div className="info-row">
						<span className="info-label">Phone:</span>
						<span className="info-value">{selectedOrder.customer?.phone}</span>
					</div>
					{selectedOrder.location && (
						<div className="info-row">
							<span className="info-label">Location:</span>
							<span className="info-value">{selectedOrder.location}</span>
						</div>
					)}
				</div>

				<hr className="receipt-divider" />

				{/* Products Table */}
				<table className="receipt-table">
					<thead>
						<tr>
							<th>ITEM</th>
							<th>AMOUNT</th>
						</tr>
					</thead>
					<tbody>
						{renderProducts(selectedOrder.products)}
					</tbody>
				</table>

				<hr className="receipt-divider" />

				{/* Totals Section */}
				<div className="receipt-totals">
					<div className="total-row">
						<span className="total-label">Subtotal:</span>
						<span className="total-value">{formatCurrency(selectedOrder.subTotal)}</span>
					</div>
					{selectedOrder.logistics > 0 && (
						<div className="total-row">
							<span className="total-label">Logistics:</span>
							<span className="total-value">{formatCurrency(selectedOrder.logistics)}</span>
						</div>
					)}
					{selectedOrder.discount > 0 && (
						<div className="total-row">
							<span className="total-label">Discount:</span>
							<span className="total-value">-{formatCurrency(selectedOrder.discount)}</span>
						</div>
					)}
					<div className="total-row total-final">
						<span className="total-label">TOTAL:</span>
						<span className="total-value">{formatCurrency(selectedOrder.amount)}</span>
					</div>
				</div>

				{/* Payment Information */}
				{selectedOrder.amountPaid !== undefined && (
					<>
						<hr className="receipt-divider" />
						<div className="receipt-payment">
							<div className="payment-row">
								<span>Amount Paid:</span>
								<span className="text-bold">{formatCurrency(selectedOrder.amountPaid)}</span>
							</div>
							{selectedOrder.balance !== undefined && selectedOrder.balance > 0 && (
								<div className="payment-row">
									<span>Balance:</span>
									<span className="text-bold">{formatCurrency(selectedOrder.balance)}</span>
								</div>
							)}
						</div>
					</>
				)}

				<hr className="receipt-divider" />

				{/* Attendant Information */}
				<div className="receipt-info">
					<div className="info-row">
						<span className="info-label">Attendant:</span>
						<span className="info-value">
							{selectedOrder.admin?.firstName} {selectedOrder.admin?.lastName}
						</span>
					</div>
				</div>

				{/* Footer Section */}
				<div className="receipt-footer">
					<div className="thank-you">THANK YOU!</div>
					<div className="footer-info">Thanks for your patronage</div>
					<div className="footer-info">We hope to see you again</div>
					<div className="footer-info mt-2">www.tikifishfarm.com</div>
					
					{/* Barcode Section */}
					<div className="barcode-section">
						<div className="barcode-text">
							*{selectedOrder.orderNumber || selectedOrder.saleNumber}*
						</div>
					</div>

					<div className="footer-info mt-2">
						Printed: {moment().format('DD/MM/YYYY HH:mm')}
					</div>
				</div>
			</div>
		</div>
	)
}

export default Print