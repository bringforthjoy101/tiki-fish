// ** Third Party Components
import { Badge, Card, CardBody, CardText, CardTitle, Button, Row, Col, Table, Media, Progress } from 'reactstrap'
import { Package, User, MapPin, CreditCard, Calendar, Hash, Phone, Mail, Truck, DollarSign, ShoppingBag, Info, CheckCircle, AlertCircle, Clock, FileText, TrendingUp, Shield } from 'react-feather'
import moment from 'moment'
import { isUserLoggedIn } from '@utils'
import {useState, useEffect} from 'react'
import {useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { completeOrder, nullifyOrder, getAllData, getOrder } from '../store/action'

const PreviewCard = ({ data }) => {
	const [userData, setUserData] = useState(null)
	const MySwal = withReactContent(Swal)
	// const history = useHistory()
  const dispatch = useDispatch()
	useEffect(() => {
		if (isUserLoggedIn()) setUserData(JSON.parse(localStorage.getItem('userData')))
	}, [])
	const renderTable = (products) => {
		return products.map((product, index) => {
			// Map field names to handle both old and new API response formats
			const productName = product.productName || product.name || 'Unknown Product'
			const productPrice = product.unitPrice || product.price || 0
			const productQuantity = product.quantity || product.qty || 0
			const productSubtotal = product.subtotal || product.amount || 0
			const productUnit = product.unit || 'kg'
			const productUnitValue = product.unitValue || ''
			
			return (
				<tr key={product.id || index} className="align-middle">
					<td className="py-2">
						<div className="d-flex align-items-center">
							<div className="avatar avatar-sm bg-light-primary rounded p-1 mr-2">
								<Package size={16} className="text-primary" />
							</div>
							<div>
								<h6 className="mb-0">{productName}</h6>
								{productUnitValue && (
									<Badge color="light-info" pill className="mt-1">
										{productUnitValue}{productUnit}
									</Badge>
								)}
							</div>
						</div>
					</td>
					<td className="py-2 text-center">
						<span className="font-weight-bold">₦{Number(productPrice).toLocaleString()}</span>
					</td>
					<td className="py-2 text-center">
						<Badge color="light-primary" pill className="px-2 py-1">
							{Number(productQuantity).toLocaleString()}
						</Badge>
					</td>
					<td className="py-2 text-right">
						<h6 className="mb-0 text-primary">₦{Number(productSubtotal).toLocaleString()}</h6>
					</td>
				</tr>
			)
		})
	}

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
		refunded: 'light-dark',
		cod: 'light-info',
		wallet: 'light-primary'
	}


	// const discountedAmount = (Number(data.amount) - Number(orderData.discount))
	// const taxedAmount = ((Number(orderData.tax) / 100) * Number(discountedAmount))
	// const totalAmount = Number(discountedAmount) + Number(taxedAmount) + Number(orderData.shipping)

	// Get status icon
	const getStatusIcon = (status) => {
		switch (status) {
			case 'pending': return <Clock size={14} />
			case 'processing': return <Package size={14} />
			case 'ready': return <CheckCircle size={14} />
			case 'delivered': return <Truck size={14} />
			case 'completed': return <CheckCircle size={14} />
			case 'cancelled': return <AlertCircle size={14} />
			default: return <Info size={14} />
		}
	}

	return data !== null ? (
		<div>
			{/* Enhanced Order Header Card */}
			<Card className="mb-3 border-0 shadow-sm">
				<CardBody>
					<Row className="align-items-center">
						<Col md="8">
							<div className="d-flex align-items-center mb-2">
								<div className="avatar avatar-xl bg-light-primary rounded p-2 mr-3">
									<Hash className="text-primary" size={28} />
								</div>
								<div>
									<h2 className="mb-0">Order #{data.orderNumber}</h2>
									<p className="text-muted mb-0">
										<Calendar size={14} className="mr-1" />
										{moment(data.createdAt).format('MMMM DD, YYYY at h:mm A')}
									</p>
								</div>
							</div>
						</Col>
						<Col md="4" className="text-md-right">
							<Badge 
								color={statusObj[data.status]} 
								pill 
								className="px-3 py-1 mb-1"
								style={{fontSize: '0.9rem'}}
							>
								{getStatusIcon(data.status)}
								<span className="ml-1">{data.status.toUpperCase()}</span>
							</Badge>
							<br />
							<Badge 
								color={paymentStatusObj[data.paymentStatus || 'pending']} 
								pill 
								className="px-3 py-1"
							>
								<CreditCard size={14} className="mr-1" />
								{(data.paymentStatus || 'pending').toUpperCase()}
							</Badge>
						</Col>
					</Row>
					
					{/* Quick Stats Row */}
					<Row className="text-center mt-3 pt-3 border-top">
						<Col xs="3">
							<h4 className="mb-0">{data.products.length}</h4>
							<small className="text-muted">Items</small>
						</Col>
						<Col xs="3">
							<h4 className="mb-0">₦{data.amount.toLocaleString()}</h4>
							<small className="text-muted">Total Amount</small>
						</Col>
						<Col xs="3">
							<h4 className="mb-0">{data.paymentMode.toUpperCase()}</h4>
							<small className="text-muted">Payment Mode</small>
						</Col>
						<Col xs="3">
							<h4 className="mb-0">{moment(data.createdAt).fromNow()}</h4>
							<small className="text-muted">Order Age</small>
						</Col>
					</Row>
				</CardBody>
			</Card>

			{/* Customer & Delivery Information Cards */}
			<Row>
				<Col lg="6" className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<CardBody>
							<CardTitle tag="h5" className="mb-3">
								<User size={20} className="mr-2" />
								Customer Information
							</CardTitle>
							<div className="d-flex align-items-center mb-2">
								<div className="avatar avatar-sm bg-light-primary rounded p-1 mr-2">
									<User size={16} className="text-primary" />
								</div>
								<div>
									<h6 className="mb-0">{data.customer.fullName}</h6>
									<small className="text-muted">Customer Name</small>
								</div>
							</div>
							<div className="d-flex align-items-center mb-2">
								<div className="avatar avatar-sm bg-light-success rounded p-1 mr-2">
									<Phone size={16} className="text-success" />
								</div>
								<div>
									<h6 className="mb-0">{data.customer.phone}</h6>
									<small className="text-muted">Phone Number</small>
								</div>
							</div>
							<div className="d-flex align-items-center">
								<div className="avatar avatar-sm bg-light-warning rounded p-1 mr-2">
									<MapPin size={16} className="text-warning" />
								</div>
								<div>
									<h6 className="mb-0">{data.location}</h6>
									<small className="text-muted">Delivery Location</small>
								</div>
							</div>
						</CardBody>
					</Card>
				</Col>
				<Col lg="6" className="mb-3">
					<Card className="h-100 border-0 shadow-sm">
						<CardBody>
							<CardTitle tag="h5" className="mb-3">
								<Truck size={20} className="mr-2" />
								Shipping Details
							</CardTitle>
							{data.shippingAddress ? (
								<div>
									<div className="d-flex align-items-start mb-2">
										<div className="avatar avatar-sm bg-light-info rounded p-1 mr-2">
											<MapPin size={16} className="text-info" />
										</div>
										<div>
											<h6 className="mb-0">Delivery Address</h6>
											<small className="text-muted">
												{data.shippingAddress.streetAddress && `${data.shippingAddress.streetAddress}, `}
												{data.shippingAddress.city && `${data.shippingAddress.city}, `}
												{data.shippingAddress.state && `${data.shippingAddress.state} `}
												{data.shippingAddress.zipCode && `${data.shippingAddress.zipCode}`}
											</small>
										</div>
									</div>
								</div>
							) : (
								<div className="d-flex align-items-center mb-2">
									<div className="avatar avatar-sm bg-light-info rounded p-1 mr-2">
										<MapPin size={16} className="text-info" />
									</div>
									<div>
										<h6 className="mb-0">{data.location}</h6>
										<small className="text-muted">Delivery Location</small>
									</div>
								</div>
							)}
							{data.trackingNumber && (
								<div className="d-flex align-items-center mb-2">
									<div className="avatar avatar-sm bg-light-primary rounded p-1 mr-2">
										<Package size={16} className="text-primary" />
									</div>
									<div>
										<h6 className="mb-0">{data.trackingNumber}</h6>
										<small className="text-muted">Tracking Number</small>
									</div>
								</div>
							)}
							<div className="d-flex align-items-center">
								<div className="avatar avatar-sm bg-light-danger rounded p-1 mr-2">
									<Clock size={16} className="text-danger" />
								</div>
								<div>
									<h6 className="mb-0">{data.updatedAt ? moment(data.updatedAt).fromNow() : 'Not updated'}</h6>
									<small className="text-muted">Last Updated</small>
								</div>
							</div>
						</CardBody>
					</Card>
				</Col>
			</Row>

			{/* Enhanced Products Table Card */}
			<Card className="mb-3 border-0 shadow-sm">
				<CardBody>
					<CardTitle tag="h5" className="mb-3">
						<ShoppingBag size={20} className="mr-2" />
						Order Items
					</CardTitle>
					<Table responsive hover className="mb-0">
						<thead className="bg-light">
							<tr>
								<th className="py-2">Product</th>
								<th className="py-2 text-center">Price</th>
								<th className="py-2 text-center">Quantity</th>
								<th className="py-2 text-right">Total</th>
							</tr>
						</thead>
						<tbody>{renderTable(data.products)}</tbody>
					</Table>
				</CardBody>
			</Card>
			{/* /Invoice Description */}

			{/* Enhanced Order Summary Card */}
			<Card className="border-0 shadow-sm">
				<CardBody>
					<Row>
						<Col lg="6">
							<CardTitle tag="h5" className="mb-3">
								<FileText size={20} className="mr-2" />
								Order Summary
							</CardTitle>
							<div className="order-summary-item d-flex justify-content-between py-2 border-bottom">
								<span className="text-muted">Subtotal</span>
								<span className="font-weight-bold">₦{data.subTotal.toLocaleString()}</span>
							</div>
							{data.logistics > 0 && (
								<div className="order-summary-item d-flex justify-content-between py-2 border-bottom">
									<span className="text-muted">
										<Truck size={14} className="mr-1" />
										Logistics
									</span>
									<span className="font-weight-bold">₦{data.logistics.toLocaleString()}</span>
								</div>
							)}
							{data.discount > 0 && (
								<div className="order-summary-item d-flex justify-content-between py-2 border-bottom">
									<span className="text-muted">
										<TrendingUp size={14} className="mr-1" />
										Discount
									</span>
									<span className="font-weight-bold text-success">-₦{data.discount.toLocaleString()}</span>
								</div>
							)}
							<div className="order-summary-item d-flex justify-content-between py-3">
								<h5 className="mb-0">Total Amount</h5>
								<h4 className="mb-0 text-primary">₦{data.amount.toLocaleString()}</h4>
							</div>
							
							{/* Payment Progress */}
							<div className="mt-3">
								<div className="d-flex justify-content-between mb-1">
									<small className="text-muted">Payment Progress</small>
									<small className="font-weight-bold">
										{data.paymentStatus === 'paid' ? '100%' : data.paymentStatus === 'partial' ? '50%' : '0%'}
									</small>
								</div>
								<Progress 
									value={data.paymentStatus === 'paid' ? 100 : data.paymentStatus === 'partial' ? 50 : 0} 
									color={data.paymentStatus === 'paid' ? 'success' : data.paymentStatus === 'partial' ? 'warning' : 'danger'}
									style={{height: '8px'}}
								/>
							</div>
						</Col>
						<Col lg="6">
							<CardTitle tag="h5" className="mb-3">
								<Info size={20} className="mr-2" />
								Additional Information
							</CardTitle>
							<div className="d-flex align-items-center mb-3">
								<div className="avatar avatar-sm bg-light-primary rounded p-1 mr-2">
									<User size={16} className="text-primary" />
								</div>
								<div>
									<small className="text-muted d-block">Initiated By</small>
									<span className="font-weight-bold">{data.admin.firstName} {data.admin.lastName}</span>
								</div>
							</div>
							<div className="d-flex align-items-center mb-3">
								<div className="avatar avatar-sm bg-light-success rounded p-1 mr-2">
									<CreditCard size={16} className="text-success" />
								</div>
								<div>
									<small className="text-muted d-block">Payment Method</small>
									<span className="font-weight-bold">{data.paymentMode.toUpperCase()}</span>
								</div>
							</div>
							<div className="d-flex align-items-center">
								<div className="avatar avatar-sm bg-light-warning rounded p-1 mr-2">
									<Shield size={16} className="text-warning" />
								</div>
								<div>
									<small className="text-muted d-block">Order ID</small>
									<span className="font-weight-bold">#{data.orderNumber}</span>
								</div>
							</div>
							
							{/* Note Section */}
							<div className="mt-3 p-2 bg-light rounded">
								<small className="text-muted">
									<Info size={14} className="mr-1" />
									Thank you for your patronage. We hope to see you again!
								</small>
							</div>
						</Col>
					</Row>
				</CardBody>
			</Card>
		</div>
	) : null
}

export default PreviewCard
