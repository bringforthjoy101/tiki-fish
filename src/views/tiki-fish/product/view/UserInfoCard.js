// ** Custom Components
import Avatar from '@components/avatar'

// ** Third Party Components
import { Card, CardBody, CardText, Row, Col, Button } from 'reactstrap'
import moment from 'moment'

import {useHistory, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { deleteProduct, getAllData } from '../store/action'

const MySwal = withReactContent(Swal)


const UserInfoCard = ({ selectedProduct }) => {

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

  return (
    <Card>
      <CardBody>
        <Row>
          <Col xl='6' lg='12' className='d-flex flex-column justify-content-between border-container-lg'>
            <div className='user-avatar-section'>
              <h3>Product Details</h3>
              <div className='d-flex justify-content-start'>
                {renderImg()}
                <div className='d-flex flex-column ml-1'>
                  <div className='user-info mt-2'>
                    <h4 className='mb-2'>{selectedProduct.name}</h4>
                    {/* <CardText tag='span'>
                      ID: {selectedProduct.status}
                    </CardText> */}
                  </div>
                  <div className='d-flex flex-wrap align-items-center'>
                    <Button.Ripple tag={Link} to={`/product/edit/${selectedProduct.id}`} color='primary'>
                      Edit
                    </Button.Ripple>
                    <Button.Ripple className='ml-1' color='danger' outline onClick={() => handleDelete(selectedProduct.id)}>
                      Delete
                    </Button.Ripple>
                  </div>
                </div>
              </div>
              <div className='d-flex align-items-center mr-2 mt-1'>
                {/* <div className='color-box'>
                  <span>Description: </span>
                </div> */}
                <div className='ml-0'>
                  <h6 className='mb-0'>{selectedProduct.description || ''}</h6>
                </div>
              </div>
            </div>
          </Col>
          <Col xl='6' lg='12' className='d-flex flex-column justify-content-between border-container-lg'>
            <div className='user-avatar-section'>
              {/* <h3>Product Details</h3> */}
              <div className='d-flex align-items-center mr-2 mt-1'>
                <div className='color-box'>
                  <span>Product Unit: </span>
                </div>
                <div className='ml-1'>
                  <h6 className='mb-0'>{selectedProduct.unitValue}{selectedProduct.unit}</h6>
                </div>
              </div>
              <div className='d-flex align-items-center mr-2 mt-1'>
                <div className='color-box'>
                  <span>Product Price: </span>
                </div>
                <div className='ml-1'>
                  <h6 className='mb-0'>{selectedProduct.price.toLocaleString()}</h6>
                </div>
              </div>
              <div className='d-flex align-items-center mr-2 mt-1'>
                <div className='color-box'>
                  <span>Product Qty: </span>
                </div>
                <div className='ml-1'>
                  <h6 className='mb-0'>{selectedProduct.qty}</h6>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

export default UserInfoCard
