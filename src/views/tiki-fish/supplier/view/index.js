// ** React Imports
import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

// ** Store & Actions
import { getSupplier } from '../store/action'
import { useSelector, useDispatch } from 'react-redux'

// ** Reactstrap
import { Row, Col, Alert, Spinner } from 'reactstrap'

// ** User View Components
import UserInfoCard from './UserInfoCard'
import SupplyHistory from './SupplyHistory'

// ** Styles
import '@styles/react/apps/app-users.scss'

const SupplierView = props => {
  // ** Store Vars
  const store = useSelector(state => state.suppliers)
  const dispatch = useDispatch()

  // ** Hooks
  const { id } = useParams()

  // ** Get supplier on mount
  useEffect(() => {
    dispatch(getSupplier(id))
  }, [dispatch, id])

  return store.selectedSupplier !== null && store.selectedSupplier !== undefined ? (
    <div className='app-user-view'>
      <Row>
        <Col xl='4' lg='5' md='5'>
          <UserInfoCard selectedSupplier={store.selectedSupplier} />
        </Col>
        <Col xl='8' lg='7' md='7'>
          <SupplyHistory id={id} />
        </Col>
      </Row>
    </div>
  ) : store.selectedSupplier === null ? (
    <Alert color='danger'>
      <h4 className='alert-heading'>Supplier not found</h4>
      <div className='alert-body'>
        Supplier with id: {id} doesn't exist. Check list of all Suppliers: <Link to='/suppliers/list'>Suppliers List</Link>
      </div>
    </Alert>
  ) : (
    <div className='d-flex justify-content-center my-3'>
      <Spinner color='primary' />
    </div>
  )
}
export default SupplierView 