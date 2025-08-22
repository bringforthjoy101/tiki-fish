// ** Custom Components
import Sidebar from '@components/sidebar'
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { swal, apiRequest } from '@utils'
import { getAllData } from '../store/action'

// ** Third Party Components
import { 
  Button, 
  FormGroup, 
  Label, 
  Spinner, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardBody,
  Badge,
  Row,
  Col,
  Alert
} from 'reactstrap'
import { AvForm, AvInput } from 'availity-reactstrap-validation-safe'
import Select from 'react-select'
import { Info, DollarSign, Package, Tag, TrendingUp } from 'react-feather'

const SidebarNewUsers = ({ open, toggleSidebar }) => {
  const dispatch = useDispatch()

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    qty: 0,
    unit: 'kg',
    unitValue: 1,
    category: 'shop',
    price: 0,
    costPrice: 0,
    packagingPrice: 0,
    smokeHousePrice: 0,
    status: 'in-stock'
  })

  const [categories, setCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profitInfo, setProfitInfo] = useState({ profit: 0, margin: 0 })

  const fetchCategories = async () => {
    try {
      const response = await apiRequest({
        url: '/categories',
        method: 'GET'
      })
      
      if (response.data.status) {
        const categoryOptions = response.data.data.map(cat => ({
          value: cat.id,
          label: cat.name
        }))
        setCategories(categoryOptions)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Fetch categories from API
  useEffect(() => {
    fetchCategories()
  }, [])

  // Calculate profit margin in real-time
  useEffect(() => {
    const totalCost = Number(productData.costPrice || 0) + 
                     Number(productData.smokeHousePrice || 0) + 
                     Number(productData.packagingPrice || 0)
    const profit = Number(productData.price || 0) - totalCost
    const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0
    
    setProfitInfo({ profit, margin })
  }, [productData.price, productData.costPrice, productData.smokeHousePrice, productData.packagingPrice])
  
  // ** Function to handle form submit
  const onSubmit = async (event, errors) => {
    setIsSubmitting(true)
    event.preventDefault()
    
    if (errors && !errors.length) {
      const submitData = {
        ...productData,
        categoryIds: selectedCategories.map(cat => cat.value)
      }
      
      const body = JSON.stringify(submitData)
      try {
        const response = await apiRequest({url:'/products/create', method:'POST', body}, dispatch)
        
        if (response.data.status) {
            setIsSubmitting(false)
            swal('Great job!', response.data.message, 'success')
            dispatch(getAllData())
            
            // Reset form
            setProductData({
              name: '',
              description: '',
              qty: 0,
              unit: 'kg',
              unitValue: 1,
              category: 'shop',
              price: 0,
              costPrice: 0,
              packagingPrice: 0,
              smokeHousePrice: 0,
              status: 'in-stock'
            })
            setSelectedCategories([])
            toggleSidebar()
        } else {
          setIsSubmitting(false)
          swal('Oops!', response.data.message, 'error')
        }
      } catch (error) {
        setIsSubmitting(false)
        console.error({error})
        swal('Error!', 'Something went wrong', 'error')
      }
    } else {
      setIsSubmitting(false)
    }
  }

  return (
    <Sidebar
      size='lg'
      open={open}
      title='New Product'
      headerClassName='mb-1'
      contentClassName='pt-0'
      toggleSidebar={toggleSidebar}
    >
      <AvForm onSubmit={onSubmit}>
        {/* Basic Information Section */}
        <Card className='mb-2'>
          <CardHeader>
            <CardTitle tag='h5'>
              <Info size={18} className='mr-1' />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardBody>
            <FormGroup>
              <Label for='name'>Product Name *</Label>
              <AvInput 
                name='name' 
                id='name' 
                placeholder='Enter product name' 
                value={productData.name}
                onChange={e => setProductData({...productData, name: e.target.value})}
                required 
              />
            </FormGroup>
            
            <FormGroup>
              <Label for='description'>Product Description</Label>
              <AvInput 
                type='textarea'
                name='description' 
                id='description' 
                rows='3'
                placeholder='Describe your product...' 
                value={productData.description}
                onChange={e => setProductData({...productData, description: e.target.value})}
              />
            </FormGroup>

            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label for='status'>Status</Label>
                  <AvInput 
                    type='select' 
                    id='status' 
                    name='status' 
                    value={productData.status}
                    onChange={e => setProductData({...productData, status: e.target.value})}
                  >
                    <option value='in-stock'>In Stock</option>
                    <option value='out-of-stock'>Out of Stock</option>
                  </AvInput>
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label for='category'>Product Type *</Label>
                  <AvInput 
                    type='select' 
                    id='category' 
                    name='category' 
                    value={productData.category}
                    onChange={e => setProductData({...productData, category: e.target.value})}
                    required
                  >
                    <option value='shop'>Shop</option>
                    <option value='store'>Store</option>
                  </AvInput>
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Pricing Details Section */}
        <Card className='mb-2'>
          <CardHeader>
            <CardTitle tag='h5'>
              <DollarSign size={18} className='mr-1' />
              Pricing Details
            </CardTitle>
            <div>
              <Badge color={profitInfo.margin > 30 ? 'light-success' : profitInfo.margin > 15 ? 'light-warning' : 'light-danger'}>
                <TrendingUp size={12} /> Margin: {profitInfo.margin.toFixed(1)}%
              </Badge>
              <Badge color='light-primary' className='ml-1'>
                Profit: {profitInfo.profit.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label for='costPrice'>Cost Price (₦) *</Label>
                  <AvInput 
                    type='number' 
                    name='costPrice' 
                    id='costPrice' 
                    placeholder='0.00' 
                    value={productData.costPrice}
                    onChange={e => setProductData({...productData, costPrice: e.target.value})}
                    required
                  />
                  <small className='text-muted'>Base cost of the product</small>
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label for='price'>Selling Price (₦) *</Label>
                  <AvInput 
                    type='number' 
                    name='price' 
                    id='price' 
                    placeholder='0.00' 
                    value={productData.price}
                    onChange={e => setProductData({...productData, price: e.target.value})}
                    required
                  />
                  <small className='text-muted'>Customer price</small>
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label for='smokeHousePrice'>Smoke House Price (₦)</Label>
                  <AvInput 
                    type='number' 
                    name='smokeHousePrice' 
                    id='smokeHousePrice' 
                    placeholder='0.00' 
                    value={productData.smokeHousePrice}
                    onChange={e => setProductData({...productData, smokeHousePrice: e.target.value})}
                  />
                  <small className='text-muted'>Processing cost</small>
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label for='packagingPrice'>Packaging Price (₦)</Label>
                  <AvInput 
                    type='number' 
                    name='packagingPrice' 
                    id='packagingPrice' 
                    placeholder='0.00' 
                    value={productData.packagingPrice}
                    onChange={e => setProductData({...productData, packagingPrice: e.target.value})}
                  />
                  <small className='text-muted'>Packaging cost</small>
                </FormGroup>
              </Col>
            </Row>
            
            {profitInfo.margin < 15 && (
              <Alert color='warning' className='mt-1'>
                <TrendingUp size={14} className='mr-1' />
                Low profit margin! Consider adjusting your pricing.
              </Alert>
            )}
          </CardBody>
        </Card>

        {/* Inventory Section */}
        <Card className='mb-2'>
          <CardHeader>
            <CardTitle tag='h5'>
              <Package size={18} className='mr-1' />
              Inventory Details
            </CardTitle>
          </CardHeader>
          <CardBody>
            <Row>
              <Col md='4'>
                <FormGroup>
                  <Label for='qty'>Initial Quantity *</Label>
                  <AvInput 
                    type='number'
                    name='qty' 
                    id='qty' 
                    placeholder='0' 
                    value={productData.qty}
                    onChange={e => setProductData({...productData, qty: e.target.value})}
                    required
                  />
                </FormGroup>
              </Col>
              <Col md='4'>
                <FormGroup>
                  <Label for='unit'>Unit Type *</Label>
                  <AvInput 
                    type='select' 
                    id='unit' 
                    name='unit' 
                    value={productData.unit}
                    onChange={e => setProductData({...productData, unit: e.target.value})}
                    required
                  >
                    <option value='kg'>Kilogram (kg)</option>
                    <option value='pck'>Pack (pck)</option>
                    <option value='pcs'>Pieces (pcs)</option>
                    <option value='l'>Litre (l)</option>
                    <option value='g'>Gram (g)</option>
                    <option value='crate'>Crate</option>
                    <option value='carton'>Carton</option>
                  </AvInput>
                </FormGroup>
              </Col>
              <Col md='4'>
                <FormGroup>
                  <Label for='unitValue'>Unit Value *</Label>
                  <AvInput 
                    type='number' 
                    name='unitValue' 
                    id='unitValue' 
                    placeholder='1' 
                    value={productData.unitValue}
                    onChange={e => setProductData({...productData, unitValue: e.target.value})}
                    required
                  />
                  <small className='text-muted'>Qty per unit</small>
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
        </Card>

        {/* Categories Section */}
        <Card className='mb-2'>
          <CardHeader>
            <CardTitle tag='h5'>
              <Tag size={18} className='mr-1' />
              Categories
            </CardTitle>
          </CardHeader>
          <CardBody>
            <FormGroup>
              <Label>Select Categories</Label>
              <Select
                isMulti
                name='categories'
                options={categories}
                className='react-select'
                classNamePrefix='select'
                value={selectedCategories}
                onChange={setSelectedCategories}
                placeholder='Choose categories...'
                isLoading={categories.length === 0}
              />
              <small className='text-muted'>Select multiple categories to help customers find this product</small>
            </FormGroup>
          </CardBody>
        </Card>

        {/* Form Actions */}
        <div className='d-flex justify-content-between'>
          <Button type='reset' color='secondary' outline onClick={toggleSidebar}>
            Cancel
          </Button>
          <Button type='submit' color='primary' disabled={isSubmitting}>
            {isSubmitting && <Spinner color='white' size='sm' className='mr-1' />}
            Create Product
          </Button>
        </div>
      </AvForm>
    </Sidebar>
  )
}

export default SidebarNewUsers