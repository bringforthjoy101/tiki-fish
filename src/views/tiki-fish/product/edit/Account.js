// ** React Imports
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Third Party Components
import { Lock, Edit, Trash2, DollarSign, Package, Info, BarChart } from 'react-feather'
import { Media, Row, Col, Button, Form, Input, Label, FormGroup, Table, CustomInput, Card, CardBody, CardHeader, CardTitle, Badge } from 'reactstrap'
import { AvForm, AvInput } from 'availity-reactstrap-validation-safe'
import { getAllData, getProduct } from '../store/action'
import { swal, apiRequest } from '@utils'

const UserAccountTab = ({ selectedProduct }) => {
	const dispatch = useDispatch()
	// ** States
	const [img, setImg] = useState(null)
	const [productData, setProductData] = useState({
		name: selectedProduct.name,
		description: selectedProduct.description || '',
		qty: selectedProduct.qty,
		price: selectedProduct.price,
		costPrice: selectedProduct.costPrice,
		packagingPrice: selectedProduct.packagingPrice,
		smokeHousePrice: selectedProduct.smokeHousePrice,
		unit: selectedProduct.unit,
		unitValue: selectedProduct.unitValue,
		category: selectedProduct.category,
		status: selectedProduct.status || 'in-stock'
	})

	const onSubmit = async (event, errors) => {
		event.preventDefault()
		console.log({ errors })
		if (errors && !errors.length) {
			console.log({ productData })
			const body = JSON.stringify(productData)
			try {
				const response = await apiRequest({ url: `/products/update/${selectedProduct.id}`, method: 'POST', body }, dispatch)
				console.log({ response })
				if (response.data.status) {
					swal('Great job!', response.data.message, 'success')
					dispatch(getAllData())
					dispatch(getProduct(selectedProduct.id))
					setProductData({
						name: selectedProduct.name,
						description: selectedProduct.description || '',
						qty: selectedProduct.qty,
						price: selectedProduct.price,
						costPrice: selectedProduct.costPrice,
						packagingPrice: selectedProduct.packagingPrice,
						smokeHousePrice: selectedProduct.smokeHousePrice,
						unitValue: selectedProduct.unitValue,
						category: selectedProduct.category,
						status: selectedProduct.status || 'in-stock'
					})
				} else {
					swal('Oops!', response.data.message, 'error')
					setProductData({
						name: selectedProduct.name,
						description: selectedProduct.description || '',
						qty: selectedProduct.qty,
						price: selectedProduct.price,
						costPrice: selectedProduct.costPrice,
						packagingPrice: selectedProduct.packagingPrice,
						smokeHousePrice: selectedProduct.smokeHousePrice,
						unitValue: selectedProduct.unitValue,
						category: selectedProduct.category,
						status: selectedProduct.status || 'in-stock'
					})
				}
			} catch (error) {
				console.error({ error })
			}
		}
	}

	// ** Function to change user image
	const onChange = (e) => {
		const reader = new FileReader(),
			files = e.target.files
		reader.onload = function () {
			setImg(reader.result)
		}
		reader.readAsDataURL(files[0])
	}

	// ** Update user image on mount or change
	useEffect(() => {
		if (selectedProduct !== null) {
			if (selectedProduct.image.length) {
				return setImg(`${process.env.REACT_APP_IMAGE_PLACEHOLDER}/placeholder.png`)
			} else {
				return setImg(null)
			}
		}
	}, [selectedProduct])

	// ** Renders User
	const renderUserAvatar = () => {
		if (img === null) {
			const stateNum = Math.floor(Math.random() * 6),
				states = ['light-success', 'light-danger', 'light-warning', 'light-info', 'light-primary', 'light-secondary'],
				color = states[stateNum]
			return (
				<Avatar
					initials
					color={color}
					className="rounded mr-2 my-25"
					content={selectedProduct.name}
					contentStyles={{
						borderRadius: 0,
						fontSize: 'calc(36px)',
						width: '100%',
						height: '100%',
					}}
					style={{
						height: '90px',
						width: '90px',
					}}
				/>
			)
		} else {
			return <img className="user-avatar rounded mr-2 my-25 cursor-pointer" src={img} alt="user profile avatar" height="90" width="90" />
		}
	}

	// Calculate profit margin
	const calculateProfitMargin = () => {
		const totalCost = Number(productData.costPrice || 0) + Number(productData.smokeHousePrice || 0) + Number(productData.packagingPrice || 0)
		const profit = Number(productData.price || 0) - totalCost
		const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0
		return { profit, margin }
	}

	const { profit, margin } = calculateProfitMargin()

	return (
		<Row>
			<Col sm="12">
				<AvForm onSubmit={onSubmit}>
					<Row>
						{/* Basic Information Card */}
						<Col lg="12">
							<Card>
								<CardHeader>
									<CardTitle tag='h4'>
										<Info size={20} className='mr-1' />
										Basic Information
									</CardTitle>
								</CardHeader>
								<CardBody>
									<Row>
										<Col md="6">
											<FormGroup>
												<Label for="name">Product Name *</Label>
												<AvInput
													name="name"
													id="name"
													placeholder="Enter product name"
													value={productData.name}
													onChange={(e) => setProductData({ ...productData, name: e.target.value })}
													required
												/>
											</FormGroup>
										</Col>
										<Col md="6">
											<FormGroup>
												<Label for="status">Product Status</Label>
												<AvInput
													type="select"
													id="status"
													name="status"
													value={productData.status}
													onChange={(e) => setProductData({ ...productData, status: e.target.value })}
												>
													<option value="in-stock">In Stock</option>
													<option value="out-of-stock">Out of Stock</option>
												</AvInput>
											</FormGroup>
										</Col>
										<Col md="12">
											<FormGroup>
												<Label for="description">Product Description</Label>
												<AvInput
													type="textarea"
													name="description"
													id="description"
													rows="4"
													placeholder="Enter product description"
													value={productData.description}
													onChange={(e) => setProductData({ ...productData, description: e.target.value })}
												/>
											</FormGroup>
										</Col>
										<Col md="6">
											<FormGroup>
												<Label for="category">Category</Label>
												<AvInput
													type="select"
													id="category"
													name="category"
													value={productData.category}
													onChange={(e) => setProductData({ ...productData, category: e.target.value })}
												>
													<option value="shop">Shop</option>
													<option value="store">Store</option>
												</AvInput>
											</FormGroup>
										</Col>
									</Row>
								</CardBody>
							</Card>
						</Col>

						{/* Pricing Information Card */}
						<Col lg="12">
							<Card>
								<CardHeader>
									<CardTitle tag='h4'>
										<DollarSign size={20} className='mr-1' />
										Pricing Strategy
									</CardTitle>
									<div>
										<Badge color="light-success" className="mr-1">
											Profit: {profit.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
										</Badge>
										<Badge color={margin > 30 ? "light-success" : margin > 15 ? "light-warning" : "light-danger"}>
											Margin: {margin.toFixed(1)}%
										</Badge>
									</div>
								</CardHeader>
								<CardBody>
									<Row>
										<Col md="6">
											<FormGroup>
												<Label for="costPrice">Cost Price (₦) *</Label>
												<AvInput
													type="number"
													name="costPrice"
													id="costPrice"
													placeholder="0.00"
													value={productData.costPrice}
													onChange={(e) => setProductData({ ...productData, costPrice: e.target.value })}
													required
												/>
												<small className="text-muted">Base cost of the product</small>
											</FormGroup>
										</Col>
										<Col md="6">
											<FormGroup>
												<Label for="price">Selling Price (₦) *</Label>
												<AvInput
													type="number"
													name="price"
													id="price"
													placeholder="0.00"
													value={productData.price}
													onChange={(e) => setProductData({ ...productData, price: e.target.value })}
													required
												/>
												<small className="text-muted">Final price for customers</small>
											</FormGroup>
										</Col>
										<Col md="6">
											<FormGroup>
												<Label for="smokeHousePrice">Smoke House Price (₦)</Label>
												<AvInput
													type="number"
													name="smokeHousePrice"
													id="smokeHousePrice"
													placeholder="0.00"
													value={productData.smokeHousePrice}
													onChange={(e) => setProductData({ ...productData, smokeHousePrice: e.target.value })}
												/>
												<small className="text-muted">Additional processing cost</small>
											</FormGroup>
										</Col>
										<Col md="6">
											<FormGroup>
												<Label for="packagingPrice">Packaging Price (₦)</Label>
												<AvInput
													type="number"
													name="packagingPrice"
													id="packagingPrice"
													placeholder="0.00"
													value={productData.packagingPrice}
													onChange={(e) => setProductData({ ...productData, packagingPrice: e.target.value })}
												/>
												<small className="text-muted">Cost of packaging materials</small>
											</FormGroup>
										</Col>
									</Row>
								</CardBody>
							</Card>
						</Col>

						{/* Inventory Management Card */}
						<Col lg="12">
							<Card>
								<CardHeader>
									<CardTitle tag='h4'>
										<Package size={20} className='mr-1' />
										Inventory Management
									</CardTitle>
									<Badge color={productData.qty > 10 ? "light-success" : productData.qty > 5 ? "light-warning" : "light-danger"}>
										Current Stock: {productData.qty} units
									</Badge>
								</CardHeader>
								<CardBody>
									<Row>
										<Col md="4">
											<FormGroup>
												<Label for="qty">Current Quantity *</Label>
												<AvInput
													type="number"
													name="qty"
													id="qty"
													placeholder="0"
													value={productData.qty}
													onChange={(e) => setProductData({ ...productData, qty: e.target.value })}
													disabled
												/>
												<small className="text-muted">Use inventory management to update</small>
											</FormGroup>
										</Col>
										<Col md="4">
											<FormGroup>
												<Label for="unitValue">Unit Value *</Label>
												<AvInput
													type="number"
													name="unitValue"
													id="unitValue"
													placeholder="1"
													value={productData.unitValue}
													onChange={(e) => setProductData({ ...productData, unitValue: e.target.value })}
													required
												/>
												<small className="text-muted">Quantity per unit</small>
											</FormGroup>
										</Col>
										<Col md="4">
											<FormGroup>
												<Label for="unit">Unit Type *</Label>
												<AvInput
													type="select"
													id="unit"
													name="unit"
													value={productData.unit}
													onChange={(e) => setProductData({ ...productData, unit: e.target.value })}
													required
												>
													<option value="kg">Kilogram (kg)</option>
													<option value="pck">Pack (pck)</option>
													<option value="pcs">Pieces (pcs)</option>
													<option value="l">Litre (l)</option>
													<option value="g">Gram (g)</option>
													<option value="crate">Crate</option>
													<option value="carton">Carton</option>
												</AvInput>
											</FormGroup>
										</Col>
									</Row>
								</CardBody>
							</Card>
						</Col>

						<Col className="d-flex flex-sm-row flex-column mt-2" sm="12">
							<Button className="mb-1 mb-sm-0 mr-0 mr-sm-1" type="submit" color="primary">
								Save Changes
							</Button>
							<Button className="mb-1 mb-sm-0" color="secondary" outline onClick={() => window.location.reload()}>
								Cancel
							</Button>
						</Col>
					</Row>
				</AvForm>
			</Col>
		</Row>
	)
}
export default UserAccountTab
