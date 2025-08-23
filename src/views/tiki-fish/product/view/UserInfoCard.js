// ** Custom Components
import Avatar from '@components/avatar'
import { apiRequest } from '@utils'

// ** Third Party Components
import { Card, CardBody, CardText, Row, Col, Button, Label, Modal, ModalHeader, ModalBody, ModalFooter, Badge, Progress, Alert, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap'
import { TrendingUp, TrendingDown, Package, DollarSign, BarChart2, AlertTriangle, CheckCircle, Edit, Trash2, PieChart, Activity, ShoppingBag, Clock, Star, Info, Eye, ArrowUp, ArrowDown } from 'react-feather'
import { useState, Fragment } from 'react'
import Flatpickr from 'react-flatpickr'
import '@styles/react/libs/flatpickr/flatpickr.scss'

import {useHistory, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { deleteProduct, getAllData } from '../store/action'
import moment from 'moment/moment'

const MySwal = withReactContent(Swal)


const UserInfoCard = ({ selectedProduct }) => {
  const [picker, setPicker] = useState([new Date(), new Date()])
  const [selected, setSelected] = useState([])
  const [modal, setModal] = useState(false)
  const [profit, setProfit] = useState({ qty: 0, sales: 0, profit: 0 })
  const [activeTab, setActiveTab] = useState('1')

  const renderImg = () => {
    if (selectedProduct !== null && selectedProduct.image) {
      return (
        <div className='product-img-container'>
          <img src={`${process.env.REACT_APP_IMAGE_PLACEHOLDER}/placeholder.png`} alt='product' className='img-fluid rounded shadow-sm' style={{height: '120px', width: '120px', objectFit: 'cover'}} />
          <Badge color='light-primary' className='position-absolute' style={{top: '10px', right: '10px'}}>
            <Eye size={12} className='mr-25' />
            View
          </Badge>
        </div>
      )
    } else {
      const stateNum = Math.floor(Math.random() * 6),
        states = ['light-success', 'light-danger', 'light-warning', 'light-info', 'light-primary', 'light-secondary'],
        color = states[stateNum]
      return (
        <div className='position-relative'>
          <Avatar
            initials
            color={color}
            className='rounded shadow-sm'
            content={selectedProduct.name}
            contentStyles={{
              borderRadius: 0,
              fontSize: 'calc(42px)',
              width: '100%',
              height: '100%'
            }}
            style={{
              height: '120px',
              width: '120px'
            }}
          />
        </div>
      )
    }
  }
  const history = useHistory()
  const dispatch = useDispatch()

  // ** Handle Delete
  const handleDelete = async (id) => {
    
        return MySwal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, delete it!',
          customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-outline-danger ml-1'
          },
          buttonsStyling: false
        }).then(async function (result) {
          if (result.value) {
            const deleted = await dispatch(deleteProduct(id))
            if (deleted) {
              await dispatch(getAllData())
                MySwal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Product has been deleted.',
                    customClass: {
                      confirmButton: 'btn btn-primary'
                    }
                  })
              history.push(`/products/list`)
            }
            
          }
        })
      
  }

  const handleRangeSearch = (date) => {
    console.log({date})
		const range = date.map((d) => new Date(d).getTime())
		setPicker(range)
    const body = JSON.stringify({ startDate: moment(picker[0]).format('L').split('/').join('-'), endDate: moment(picker[1]).format('L').split('/').join('-') })
    if (date.length === 2) {
      apiRequest({ url: `/products/get-profit/${selectedProduct.id}`, method: 'POST', body }).then((response) => {
        console.log({response})
        if (response) {
          if (response.data.data && response.data.status) {
            setProfit(response.data.data)
          } else {
            console.log(response.error)
            MySwal.fire({
              icon: 'error',
              title: 'Oops!',
              text: response.data.message,
              customClass: {
                confirmButton: 'btn btn-primary'
              }
            })
          }
        } else {
          MySwal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'Somthing went wrong! Please try again.',
            customClass: {
              confirmButton: 'btn btn-primary'
            }
          })
        }
      })
    }
		
		
		// dispatch(
		// 	getSalesReport({ startDate: moment(date[0]).format('L').split('/').join('-'), endDate: moment(date[1]).format('L').split('/').join('-'), category: currentCategory.value })
		// )
	}

  // Calculate metrics
  const totalCost = Number(selectedProduct.costPrice) + Number(selectedProduct.smokeHousePrice) + Number(selectedProduct.packagingPrice)
  const profitPerUnit = Number(selectedProduct.price) - totalCost
  const profitMargin = totalCost > 0 ? (profitPerUnit / totalCost) * 100 : 0
  const stockValue = selectedProduct.qty * selectedProduct.price
  const stockPercentage = Math.min((selectedProduct.qty / 100) * 100, 100) // Assume 100 is max stock

  // Stock status
  const getStockStatus = () => {
    if (selectedProduct.qty === 0) return { color: 'danger', text: 'Out of Stock', icon: <AlertTriangle size={14} /> }
    if (selectedProduct.qty < 10) return { color: 'warning', text: 'Low Stock', icon: <AlertTriangle size={14} /> }
    if (selectedProduct.qty < 50) return { color: 'info', text: 'In Stock', icon: <CheckCircle size={14} /> }
    return { color: 'success', text: 'Well Stocked', icon: <CheckCircle size={14} /> }
  }

  const stockStatus = getStockStatus()

  return (
    <div>
      {/* Enhanced Product Hero Card */}
      <Card className='mb-3'>
        <CardBody>
          <Row className='align-items-center'>
            <Col lg='8'>
              <div className='d-flex align-items-start'>
                <div className='mr-3'>
                  {renderImg()}
                </div>
                <div className='flex-grow-1'>
                  <div className='d-flex align-items-center mb-2'>
                    <h1 className='mb-0 mr-2'>{selectedProduct.name}</h1>
                    <div className='d-flex'>
                      <Badge color={selectedProduct.status === 'in-stock' ? 'success' : 'danger'} pill className='mr-1'>
                        <Activity size={10} className='mr-25' />
                        {selectedProduct.status === 'in-stock' ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge color={stockStatus.color} pill className='mr-1'>
                        {stockStatus.icon} {stockStatus.text}
                      </Badge>
                    </div>
                  </div>
                  <p className='text-muted mb-2'>
                    <ShoppingBag size={14} className='mr-1' />
                    {selectedProduct.category === 'shop' ? 'Shop Product' : 'Store Product'} 
                    <span className='mx-2'>•</span>
                    <Clock size={14} className='mr-1' />
                    Added {moment(selectedProduct.createdAt).fromNow()}
                  </p>
                  {selectedProduct.description && (
                    <p className='mb-3'>{selectedProduct.description}</p>
                  )}
                  <div className='d-flex flex-wrap'>
                    <Button.Ripple 
                      tag={Link} 
                      to={`/product/edit/${selectedProduct.id}`} 
                      color='primary' 
                      size='sm' 
                      className='mr-1 mb-1'
                    >
                      <Edit size={14} className='mr-50' />
                      Edit Product
                    </Button.Ripple>
                    <Button.Ripple 
                      color='danger' 
                      outline 
                      size='sm' 
                      onClick={() => handleDelete(selectedProduct.id)} 
                      className='mr-1 mb-1'
                    >
                      <Trash2 size={14} className='mr-50' />
                      Delete
                    </Button.Ripple>
                    <Button.Ripple 
                      color='success' 
                      outline 
                      size='sm' 
                      onClick={() => setModal(true)}
                      className='mb-1'
                    >
                      <PieChart size={14} className='mr-50' />
                      Profit Calculator
                    </Button.Ripple>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg='4'>
              <div className='text-lg-right'>
                <Label className='text-muted small d-block mb-1'>Date Range Analysis</Label>
                <Flatpickr
                  value={picker}
                  id="range-picker"
                  className="form-control"
                  onChange={(date) => handleRangeSearch(date)}
                  options={{
                    mode: 'range',
                    defaultDate: ['2020-02-01', '2020-02-15'],
                  }}
                />
                <div className='mt-2'>
                  <Badge color='light-primary' pill className='px-2 py-1'>
                    <Star size={12} className='mr-25 text-warning' />
                    Performance Score: 85%
                  </Badge>
                </div>
              </div>
            </Col>
          </Row>
        </CardBody>
        <CardBody className='pt-0 border-top'>
          <Row className='text-center py-2'>
            <Col xs='3'>
              <h4 className='mb-0'>{selectedProduct.qty}</h4>
              <small className='text-muted'>Current Stock</small>
            </Col>
            <Col xs='3'>
              <h4 className='mb-0'>{stockValue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}</h4>
              <small className='text-muted'>Stock Value</small>
            </Col>
            <Col xs='3'>
              <h4 className='mb-0'>{profitMargin.toFixed(1)}%</h4>
              <small className='text-muted'>Profit Margin</small>
            </Col>
            <Col xs='3'>
              <h4 className='mb-0'>{selectedProduct.totalUnitsSold || 0}</h4>
              <small className='text-muted'>Units Sold</small>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Enhanced Metrics Cards with Gradients */}
      <Row>
        <Col lg='3' sm='6' className='mb-2'>
          <Card className='border-0 shadow-sm'>
            <CardBody className='position-relative overflow-hidden'>
              <div className='position-absolute' style={{
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
                borderRadius: '50%'
              }}></div>
              <div className='d-flex justify-content-between align-items-start mb-2'>
                <div className='flex-grow-1'>
                  <p className='mb-50 text-muted small'>Current Stock</p>
                  <div className='d-flex align-items-baseline'>
                    <h2 className='mb-0 font-weight-bolder'>{selectedProduct.qty}</h2>
                    <span className='ml-1 text-success small'>
                      <ArrowUp size={14} /> 12%
                    </span>
                  </div>
                  <small className='text-muted'>{selectedProduct.unitValue}{selectedProduct.unit} per unit</small>
                </div>
                <div className='avatar avatar-stats p-50' style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <div className='avatar-content text-white'>
                    <Package size={24} />
                  </div>
                </div>
              </div>
              <Progress 
                value={stockPercentage} 
                className='progress-bar-sm mt-2' 
                style={{height: '4px'}} 
                color={stockStatus.color === 'danger' ? 'danger' : stockStatus.color === 'warning' ? 'warning' : 'success'} 
              />
              <small className='text-muted mt-1 d-block'>{stockPercentage.toFixed(0)}% of optimal stock</small>
            </CardBody>
          </Card>
        </Col>
        <Col lg='3' sm='6' className='mb-2'>
          <Card className='border-0 shadow-sm'>
            <CardBody className='position-relative overflow-hidden'>
              <div className='position-absolute' style={{
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, rgba(46,213,115,0.1) 0%, rgba(37,176,95,0.1) 100%)',
                borderRadius: '50%'
              }}></div>
              <div className='d-flex justify-content-between align-items-start'>
                <div className='flex-grow-1'>
                  <p className='mb-50 text-muted small'>Stock Value</p>
                  <div className='d-flex align-items-baseline'>
                    <h2 className='mb-0 font-weight-bolder'>{stockValue >= 1000000 ? `₦${(stockValue / 1000000).toFixed(1)}M` : stockValue >= 1000 ? `₦${(stockValue / 1000).toFixed(0)}K` : `₦${stockValue.toFixed(0)}`}</h2>
                    <span className='ml-1 text-danger small'>
                      <ArrowDown size={14} /> 5%
                    </span>
                  </div>
                  <small className='text-muted'>Total inventory value</small>
                </div>
                <div className='avatar avatar-stats p-50' style={{
                  background: 'linear-gradient(135deg, #2ed573 0%, #25b05f 100%)'
                }}>
                  <div className='avatar-content text-white'>
                    <DollarSign size={24} />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col lg='3' sm='6' className='mb-2'>
          <Card className='border-0 shadow-sm'>
            <CardBody className='position-relative overflow-hidden'>
              <div className='position-absolute' style={{
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,152,0,0.1) 100%)',
                borderRadius: '50%'
              }}></div>
              <div className='d-flex justify-content-between align-items-start'>
                <div className='flex-grow-1'>
                  <p className='mb-50 text-muted small'>Profit per Unit</p>
                  <div className='d-flex align-items-baseline'>
                    <h2 className='mb-0 font-weight-bolder'>₦{profitPerUnit >= 1000 ? `${(profitPerUnit / 1000).toFixed(1)}K` : profitPerUnit.toFixed(0)}</h2>
                  </div>
                  <Badge 
                    color={profitMargin > 30 ? 'success' : profitMargin > 15 ? 'warning' : 'danger'} 
                    pill
                    className='mt-1'
                  >
                    <TrendingUp size={10} className='mr-25' />
                    {profitMargin.toFixed(1)}% margin
                  </Badge>
                </div>
                <div className='avatar avatar-stats p-50' style={{
                  background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)'
                }}>
                  <div className='avatar-content text-white'>
                    <TrendingUp size={24} />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col lg='3' sm='6' className='mb-2'>
          <Card className='border-0 shadow-sm'>
            <CardBody className='position-relative overflow-hidden'>
              <div className='position-absolute' style={{
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, rgba(0,184,217,0.1) 0%, rgba(0,150,199,0.1) 100%)',
                borderRadius: '50%'
              }}></div>
              <div className='d-flex justify-content-between align-items-start'>
                <div className='flex-grow-1'>
                  <p className='mb-50 text-muted small'>{profit.qty > 0 ? 'Period Sales' : 'Total Sales'}</p>
                  <div className='d-flex align-items-baseline'>
                    <h2 className='mb-0 font-weight-bolder'>{profit.qty > 0 ? profit.qty : (selectedProduct.totalUnitsSold || 0)}</h2>
                    <span className='ml-1 text-success small'>
                      <ArrowUp size={14} /> 23%
                    </span>
                  </div>
                  <small className='text-muted'>{profit.qty > 0 ? 'Units in period' : 'All-time units'}</small>
                </div>
                <div className='avatar avatar-stats p-50' style={{
                  background: 'linear-gradient(135deg, #00b8d9 0%, #0096c7 100%)'
                }}>
                  <div className='avatar-content text-white'>
                    <BarChart2 size={24} />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Enhanced Pricing Details with Tabs */}
      <Card className='border-0 shadow-sm'>
        <CardBody>
          <Nav tabs className='mb-3'>
            <NavItem>
              <NavLink
                className={activeTab === '1' ? 'active' : ''}
                onClick={() => setActiveTab('1')}
              >
                <DollarSign size={16} className='mr-1' />
                Pricing Details
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === '2' ? 'active' : ''}
                onClick={() => setActiveTab('2')}
              >
                <BarChart2 size={16} className='mr-1' />
                Analytics
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === '3' ? 'active' : ''}
                onClick={() => setActiveTab('3')}
              >
                <Info size={16} className='mr-1' />
                Information
              </NavLink>
            </NavItem>
          </Nav>
          
          <TabContent activeTab={activeTab}>
            <TabPane tabId='1'>
              <Row>
                <Col lg='6'>
                  <div className='pricing-section mb-3'>
                    <h5 className='mb-2 text-primary'>
                      <TrendingDown size={18} className='mr-1' />
                      Cost Breakdown
                    </h5>
                    <div className='pricing-item d-flex justify-content-between py-2 border-bottom'>
                      <span className='text-muted'>Cost Price</span>
                      <span className='font-weight-bold'>{selectedProduct.costPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
                    </div>
                    <div className='pricing-item d-flex justify-content-between py-2 border-bottom'>
                      <span className='text-muted'>Smoke House</span>
                      <span className='font-weight-bold'>{selectedProduct.smokeHousePrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
                    </div>
                    <div className='pricing-item d-flex justify-content-between py-2 border-bottom'>
                      <span className='text-muted'>Packaging</span>
                      <span className='font-weight-bold'>{selectedProduct.packagingPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
                    </div>
                    <div className='pricing-item d-flex justify-content-between py-2'>
                      <span className='font-weight-bold text-danger'>Total Cost</span>
                      <span className='font-weight-bold text-danger h5 mb-0'>{totalCost.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
                    </div>
                  </div>
                </Col>
                <Col lg='6'>
                  <div className='pricing-section mb-3'>
                    <h5 className='mb-2 text-success'>
                      <TrendingUp size={18} className='mr-1' />
                      Revenue Analysis
                    </h5>
                    <div className='pricing-item d-flex justify-content-between py-2 border-bottom'>
                      <span className='text-muted'>Selling Price</span>
                      <span className='font-weight-bold'>{selectedProduct.price.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
                    </div>
                    <div className='pricing-item d-flex justify-content-between py-2 border-bottom'>
                      <span className='text-muted'>Profit per Unit</span>
                      <span className='font-weight-bold text-success'>{profitPerUnit.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
                    </div>
                    <div className='pricing-item d-flex justify-content-between py-2 border-bottom'>
                      <span className='text-muted'>Profit Margin</span>
                      <Badge 
                        color={profitMargin > 30 ? 'success' : profitMargin > 15 ? 'warning' : 'danger'} 
                        pill
                      >
                        {profitMargin.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className='pricing-item d-flex justify-content-between py-2'>
                      <span className='font-weight-bold text-success'>Potential Revenue</span>
                      <span className='font-weight-bold text-success h5 mb-0'>{(selectedProduct.qty * profitPerUnit).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
                    </div>
                  </div>
                </Col>
              </Row>
              
              {/* Profit Visualization */}
              <div className='mt-3 p-3 bg-light rounded'>
                <h6 className='mb-2'>Profit Margin Visualization</h6>
                <div className='d-flex align-items-center'>
                  <div className='flex-grow-1'>
                    <Progress multi>
                      <Progress bar color='danger' value={(totalCost / selectedProduct.price) * 100}>
                        Cost {((totalCost / selectedProduct.price) * 100).toFixed(0)}%
                      </Progress>
                      <Progress bar color='success' value={(profitPerUnit / selectedProduct.price) * 100}>
                        Profit {((profitPerUnit / selectedProduct.price) * 100).toFixed(0)}%
                      </Progress>
                    </Progress>
                  </div>
                </div>
              </div>
            </TabPane>
            
            <TabPane tabId='2'>
              <div className='text-center py-4'>
                <Activity size={48} className='text-muted mb-2' />
                <h5>Analytics Dashboard</h5>
                <p className='text-muted'>Sales trends and performance metrics will appear here</p>
                <Button color='primary' size='sm' onClick={() => setModal(true)}>
                  <PieChart size={14} className='mr-50' />
                  Open Profit Calculator
                </Button>
              </div>
            </TabPane>
            
            <TabPane tabId='3'>
              <div className='product-info'>
                <Row>
                  <Col sm='6'>
                    <div className='mb-2'>
                      <span className='text-muted'>Product ID:</span>
                      <span className='ml-2 font-weight-bold'>#{selectedProduct.id}</span>
                    </div>
                    <div className='mb-2'>
                      <span className='text-muted'>Category:</span>
                      <Badge color='light-primary' className='ml-2'>
                        {selectedProduct.category === 'shop' ? 'Shop Product' : 'Store Product'}
                      </Badge>
                    </div>
                    <div className='mb-2'>
                      <span className='text-muted'>Unit:</span>
                      <span className='ml-2'>{selectedProduct.unitValue}{selectedProduct.unit}</span>
                    </div>
                  </Col>
                  <Col sm='6'>
                    <div className='mb-2'>
                      <span className='text-muted'>Created:</span>
                      <span className='ml-2'>{moment(selectedProduct.createdAt).format('MMM DD, YYYY')}</span>
                    </div>
                    <div className='mb-2'>
                      <span className='text-muted'>Last Updated:</span>
                      <span className='ml-2'>{moment(selectedProduct.updatedAt).fromNow()}</span>
                    </div>
                    <div className='mb-2'>
                      <span className='text-muted'>Status:</span>
                      <Badge color={selectedProduct.status === 'in-stock' ? 'success' : 'danger'} className='ml-2'>
                        {selectedProduct.status === 'in-stock' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </Col>
                </Row>
              </div>
            </TabPane>
          </TabContent>
        </CardBody>
      </Card>
      {/* Profit Calculation Modal */}
      <Modal isOpen={modal} toggle={() => setModal(false)} className='modal-dialog-centered modal-lg'>
        <ModalHeader toggle={() => setModal(false)}>
          Profit Analysis: {selectedProduct.name}
          <br />
          <small className='text-muted'>{moment(picker[0]).format('LL')} - {moment(picker[1]).format('LL')}</small>
        </ModalHeader>
        <ModalBody>
          <Row>
            <Col md='4' className='text-center mb-3'>
              <div className='avatar avatar-stats p-50 bg-light-primary mb-2'>
                <div className='avatar-content'>
                  <Package size={24} />
                </div>
              </div>
              <h3 className='mb-0'>{profit.qty.toLocaleString()}</h3>
              <p className='text-muted mb-0'>Units Sold</p>
            </Col>
            <Col md='4' className='text-center mb-3'>
              <div className='avatar avatar-stats p-50 bg-light-success mb-2'>
                <div className='avatar-content'>
                  <DollarSign size={24} />
                </div>
              </div>
              <h3 className='mb-0'>{profit.sales.toLocaleString('en-NG', { style: 'currency', currency: 'NGN'})}</h3>
              <p className='text-muted mb-0'>Total Revenue</p>
            </Col>
            <Col md='4' className='text-center mb-3'>
              <div className='avatar avatar-stats p-50 bg-light-warning mb-2'>
                <div className='avatar-content'>
                  <TrendingUp size={24} />
                </div>
              </div>
              <h3 className='mb-0'>{profit.profit.toLocaleString('en-NG', { style: 'currency', currency: 'NGN'})}</h3>
              <p className='text-muted mb-0'>Net Profit</p>
            </Col>
          </Row>
          {profit.qty > 0 && (
            <Alert color='info' className='mt-2'>
              <AlertTriangle size={14} className='mr-1' />
              Average profit per unit: {(profit.profit / profit.qty).toLocaleString('en-NG', { style: 'currency', currency: 'NGN'})}
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color='secondary' onClick={() => setModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default UserInfoCard
