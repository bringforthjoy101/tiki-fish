// ** Custom Components
import Avatar from '@components/avatar'
import { apiRequest } from '@utils'

// ** Third Party Components
import { Card, CardBody, CardText, Row, Col, Button, Label, Modal, ModalHeader, ModalBody, ModalFooter, Badge, Progress, Alert } from 'reactstrap'
import { TrendingUp, TrendingDown, Package, DollarSign, BarChart2, AlertTriangle, CheckCircle } from 'react-feather'
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

  const renderImg = () => {
    if (selectedProduct !== null && selectedProduct.image) {
      return <img src={`${process.env.REACT_APP_IMAGE_PLACEHOLDER}/placeholder.png`} alt='user-avatar' className='img-fluid rounded' height='104' width='104' />
    } else {
      const stateNum = Math.floor(Math.random() * 6),
        states = ['light-success', 'light-danger', 'light-warning', 'light-info', 'light-primary', 'light-secondary'],
        color = states[stateNum]
      return (
        <Avatar
          initials
          color={color}
          className='rounded'
          content={selectedProduct.name}
          contentStyles={{
            borderRadius: 0,
            fontSize: 'calc(36px)',
            width: '100%',
            height: '100%'
          }}
          style={{
            height: '90px',
            width: '90px'
          }}
        />
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
      {/* Product Header Card */}
      <Card className='mb-3'>
        <CardBody>
          <Row className='align-items-center'>
            <Col lg='8'>
              <div className='d-flex align-items-center'>
                <div>
                  <h2 className='mb-1'>{selectedProduct.name}</h2>
                  <div className='d-flex align-items-center mb-2'>
                    <Badge color={selectedProduct.status === 'in-stock' ? 'light-success' : 'light-danger'} className='mr-1'>
                      {selectedProduct.status === 'in-stock' ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge color={stockStatus.color} className='mr-1'>
                      {stockStatus.icon} {stockStatus.text}
                    </Badge>
                    <Badge color='light-info'>
                      {selectedProduct.category === 'shop' ? 'Shop Product' : 'Store Product'}
                    </Badge>
                  </div>
                  {selectedProduct.description && (
                    <p className='text-muted mb-2'>{selectedProduct.description}</p>
                  )}
                  <div className='d-flex flex-wrap'>
                    <Button.Ripple tag={Link} to={`/product/edit/${selectedProduct.id}`} color='primary' size='sm' className='mr-1'>
                      Edit Product
                    </Button.Ripple>
                    <Button.Ripple color='danger' outline size='sm' onClick={() => handleDelete(selectedProduct.id)} className='mr-1'>
                      Delete
                    </Button.Ripple>
                    <Button.Ripple color='success' outline size='sm' onClick={() => setModal(true)}>
                      Calculate Profit
                    </Button.Ripple>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg='4'>
              <div className='text-lg-right'>
                <Label className='text-muted small'>Date Range Analysis</Label>
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
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Metrics Cards Row */}
      <Row>
        <Col lg='3' sm='6'>
          <Card>
            <CardBody>
              <div className='d-flex justify-content-between align-items-center mb-1'>
                <div>
                  <p className='mb-0 text-muted'>Current Stock</p>
                  <h3 className='mb-0'>{selectedProduct.qty}</h3>
                  <small>{selectedProduct.unitValue}{selectedProduct.unit} per unit</small>
                </div>
                <div className='avatar avatar-stats p-50 bg-light-primary'>
                  <div className='avatar-content'>
                    <Package size={24} />
                  </div>
                </div>
              </div>
              <Progress value={stockPercentage} className='mt-2' style={{height: '6px'}} color={stockStatus.color} />
            </CardBody>
          </Card>
        </Col>
        <Col lg='3' sm='6'>
          <Card>
            <CardBody>
              <div className='d-flex justify-content-between align-items-center'>
                <div>
                  <p className='mb-0 text-muted'>Stock Value</p>
                  <h3 className='mb-0'>{stockValue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</h3>
                  <small>Total inventory value</small>
                </div>
                <div className='avatar avatar-stats p-50 bg-light-success'>
                  <div className='avatar-content'>
                    <DollarSign size={24} />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col lg='3' sm='6'>
          <Card>
            <CardBody>
              <div className='d-flex justify-content-between align-items-center'>
                <div>
                  <p className='mb-0 text-muted'>Profit per Unit</p>
                  <h3 className='mb-0'>{profitPerUnit.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</h3>
                  <Badge color={profitMargin > 30 ? 'light-success' : profitMargin > 15 ? 'light-warning' : 'light-danger'}>
                    {profitMargin.toFixed(1)}% margin
                  </Badge>
                </div>
                <div className='avatar avatar-stats p-50 bg-light-warning'>
                  <div className='avatar-content'>
                    <TrendingUp size={24} />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col lg='3' sm='6'>
          <Card>
            <CardBody>
              <div className='d-flex justify-content-between align-items-center'>
                <div>
                  <p className='mb-0 text-muted'>{profit.qty > 0 ? 'Period Sales' : 'Total Sales'}</p>
                  <h3 className='mb-0'>{profit.qty > 0 ? profit.qty : (selectedProduct.totalUnitsSold || 0)}</h3>
                  <small>{profit.qty > 0 ? 'Units sold in period' : 'All-time units sold'}</small>
                </div>
                <div className='avatar avatar-stats p-50 bg-light-info'>
                  <div className='avatar-content'>
                    <BarChart2 size={24} />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Pricing Details Card */}
      <Card>
        <CardBody>
          <h4 className='mb-2'>
            <DollarSign size={20} className='mr-1' />
            Pricing Breakdown
          </h4>
          <Row>
            <Col lg='6'>
              <table className='table table-borderless'>
                <tbody>
                  <tr>
                    <td className='pl-0'>Cost Price:</td>
                    <td className='text-right font-weight-bold'>
                      {selectedProduct.costPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                    </td>
                  </tr>
                  <tr>
                    <td className='pl-0'>Smoke House Price:</td>
                    <td className='text-right font-weight-bold'>
                      {selectedProduct.smokeHousePrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                    </td>
                  </tr>
                  <tr>
                    <td className='pl-0'>Packaging Price:</td>
                    <td className='text-right font-weight-bold'>
                      {selectedProduct.packagingPrice.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                    </td>
                  </tr>
                  <tr className='border-top'>
                    <td className='pl-0'><strong>Total Cost:</strong></td>
                    <td className='text-right font-weight-bold text-danger'>
                      {totalCost.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Col>
            <Col lg='6'>
              <table className='table table-borderless'>
                <tbody>
                  <tr>
                    <td className='pl-0'>Selling Price:</td>
                    <td className='text-right font-weight-bold'>
                      {selectedProduct.price.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                    </td>
                  </tr>
                  <tr>
                    <td className='pl-0'>Profit per Unit:</td>
                    <td className='text-right font-weight-bold text-success'>
                      {profitPerUnit.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                    </td>
                  </tr>
                  <tr>
                    <td className='pl-0'>Profit Margin:</td>
                    <td className='text-right'>
                      <Badge color={profitMargin > 30 ? 'success' : profitMargin > 15 ? 'warning' : 'danger'}>
                        {profitMargin.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                  <tr className='border-top'>
                    <td className='pl-0'><strong>Potential Revenue:</strong></td>
                    <td className='text-right font-weight-bold text-success'>
                      {(selectedProduct.qty * profitPerUnit).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Col>
          </Row>
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
