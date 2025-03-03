// ** React Imports
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

// ** Store & Actions
import { getSupplier, updateSupplier } from '../store/action'
import { useSelector, useDispatch } from 'react-redux'

// ** Third Party Components
import { User, Info, Share2, MapPin, Check, X } from 'react-feather'
import { Card, CardBody, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner } from 'reactstrap'

// ** Styles
import '@styles/react/apps/app-users.scss'

// ** User Edit Tab Components
import SupplierInfo from './SupplierInfo'

const SupplierEdit = () => {
  // ** States & Vars
  const [activeTab, setActiveTab] = useState('1')
  const store = useSelector(state => state.suppliers)
  const dispatch = useDispatch()
  const { id } = useParams()

  // ** Function to toggle tabs
  const toggle = tab => setActiveTab(tab)

  // ** Get supplier on mount
  useEffect(() => {
    dispatch(getSupplier(id))
  }, [dispatch, id])

  return store.selectedSupplier !== null && store.selectedSupplier !== undefined ? (
    <Row className='app-user-edit'>
      <Col sm='12'>
        <Card>
          <CardBody className='pt-2'>
            <Nav pills>
              <NavItem>
                <NavLink active={activeTab === '1'} onClick={() => toggle('1')}>
                  <User size={14} />
                  <span className='align-middle d-none d-sm-block'>Supplier Info</span>
                </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={activeTab}>
              <TabPane tabId='1'>
                <SupplierInfo selectedSupplier={store.selectedSupplier} />
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Col>
    </Row>
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
export default SupplierEdit 