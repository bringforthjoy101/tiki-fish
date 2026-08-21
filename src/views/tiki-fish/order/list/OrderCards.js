import { Fragment } from 'react'
import { useDispatch } from 'react-redux'
import { Card, CardBody, Badge, Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Spinner } from 'reactstrap'
import { Link } from 'react-router-dom'
import { Eye, MoreVertical, Phone, MapPin, FileText, ArrowRight } from 'react-feather'
import moment from 'moment'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { orderStatus, paymentStatusConfig } from './columns'
import { updateOrderStatus, refreshOrders } from '../store/action'

const MySwal = withReactContent(Swal)

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

/**
 * The order the fulfilment statuses actually run in.
 *
 * Mirrors ADVANCEABLE_STATUSES in api/helpers/permissions.js. The card offers the NEXT one only:
 * a list of every status is a menu of ways to get it wrong on a small screen, and the API
 * refuses anything a storekeeper should not set anyway.
 */
const FULFILMENT = ['pending', 'processing', 'ready', 'out_for_delivery', 'delivered']

const nextStatus = (current) => {
	const i = FULFILMENT.indexOf(current)
	if (i === -1 || i === FULFILMENT.length - 1) return null
	return FULFILMENT[i + 1]
}

const StatusBadge = ({ config, value }) => {
	const c = config[value] || { color: 'light-secondary', label: value }
	return (
		<Badge color={c.color} pill className="mr-50">
			{c.icon} <span className="align-middle">{c.label}</span>
		</Badge>
	)
}

/**
 * One order, as a card.
 *
 * Everything the interview said a rep needs without tapping: number, amount, customer, phone,
 * location, age, and both statuses. On a 390px phone the table equivalent is 1,020px of minimum
 * column width — nearly three screens of sideways scrolling to read one row.
 */
const OrderCard = ({ order, canAdvance, onChanged }) => {
	const dispatch = useDispatch()
	const next = nextStatus(order.status)

	const advance = async () => {
		const label = orderStatus[next]?.label || next
		const result = await MySwal.fire({
			title: `Mark as ${label}?`,
			html: `<p style="text-align:left">Order <b>#${order.orderNumber}</b> for <b>${order.customer?.fullName || 'this customer'}</b> moves from <b>${orderStatus[order.status]?.label || order.status}</b> to <b>${label}</b>.</p>`,
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: `Yes, mark ${label}`,
			cancelButtonText: 'Cancel',
			customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-outline-secondary ml-1' },
			buttonsStyling: false
		})
		if (!result.isConfirmed) return
		const ok = await dispatch(updateOrderStatus(order.id, next))
		if (ok) onChanged()
	}

	return (
		<Card className="mb-1">
			<CardBody className="p-1">
				<div className="d-flex justify-content-between align-items-start">
					<div className="min-width-0">
						<Link to={`/order/preview/${order.id}`} className="font-weight-bolder">
							#{order.orderNumber}
						</Link>
						<div className="text-truncate font-weight-bold mt-25">{order.customer?.fullName || 'Walk-in'}</div>
					</div>
					<div className="text-right flex-shrink-0 ml-1">
						<div className="font-weight-bolder" style={{ fontVariantNumeric: 'tabular-nums' }}>
							{naira(order.amount)}
						</div>
						<small className="text-muted">{moment(order.createdAt).fromNow()}</small>
					</div>
				</div>

				{order.customer?.phone && (
					<div className="text-muted mt-50" style={{ fontSize: '0.85rem' }}>
						{/* A tel: link, because the reason a rep is looking at this is usually to call. */}
						<Phone size={13} className="mr-50" />
						<a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
					</div>
				)}
				{order.location && (
					<div className="text-muted text-truncate" style={{ fontSize: '0.85rem' }}>
						<MapPin size={13} className="mr-50" />
						{order.location}
					</div>
				)}

				<div className="d-flex justify-content-between align-items-center mt-1">
					<div className="text-truncate">
						<StatusBadge config={orderStatus} value={order.status} />
						<StatusBadge config={paymentStatusConfig} value={order.paymentStatus} />
					</div>
					<div className="d-flex align-items-center flex-shrink-0">
						<Button tag={Link} to={`/order/preview/${order.id}`} color="flat-primary" size="sm" className="btn-icon">
							<Eye size={16} />
						</Button>
						<UncontrolledDropdown>
							<DropdownToggle tag="div" className="btn btn-sm p-50">
								<MoreVertical size={16} className="cursor-pointer" />
							</DropdownToggle>
							<DropdownMenu right>
								<DropdownItem tag={Link} to={`/order/preview/${order.id}`}>
									<Eye size={14} className="mr-50" /> View details
								</DropdownItem>
								<DropdownItem tag={Link} to={`/order/print/${order.id}`}>
									<FileText size={14} className="mr-50" /> Print
								</DropdownItem>
								{/* Only the next step forward, and only for someone allowed to take it.
								    Completing, cancelling and refunding are not here on purpose —
								    completing books revenue to the ledger. */}
								{canAdvance && next && (
									<DropdownItem onClick={advance}>
										<ArrowRight size={14} className="mr-50" /> Mark as {orderStatus[next]?.label || next}
									</DropdownItem>
								)}
							</DropdownMenu>
						</UncontrolledDropdown>
					</div>
				</div>
			</CardBody>
		</Card>
	)
}

/**
 * The card list. Two per row on a tablet, one on a phone — a CSS grid rather than a JS branch,
 * so there is one component and the columns come from the container width.
 */
const OrderCards = ({ orders, breakpoint, canAdvance, loading }) => {
	const dispatch = useDispatch()
	const onChanged = () => dispatch(refreshOrders())

	if (loading) {
		return (
			<div className="text-center py-3">
				<Spinner />
			</div>
		)
	}

	if (!orders.length) {
		return (
			<div className="text-center py-3 text-muted">
				<p className="mb-0">No orders match what you are looking for.</p>
				<small>Try a wider date range, or clear the filters.</small>
			</div>
		)
	}

	return (
		<Fragment>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: breakpoint === 'tablet' ? '1fr 1fr' : '1fr',
					gap: '0.5rem'
				}}
			>
				{orders.map((order) => (
					<OrderCard key={order.id} order={order} canAdvance={canAdvance} onChanged={onChanged} />
				))}
			</div>
		</Fragment>
	)
}

export default OrderCards
