// ** React Imports
import { Fragment } from 'react'

// ** Third Party Components
import { Row, Col, Card, CardBody } from 'reactstrap'
import { Package, DollarSign, CheckCircle, Clock, AlertTriangle } from 'react-feather'

const StatsCards = ({ summary }) => {
  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
  }

  const statsData = [
    {
      title: 'Total Supplies',
      value: summary?.totalSupplies || 0,
      icon: <Package size={24} />,
      color: 'primary',
      subtitle: 'All supplies'
    },
    {
      title: 'Total Amount',
      value: formatCurrency(summary?.totalAmount),
      icon: <DollarSign size={24} />,
      color: 'info',
      subtitle: 'Total supply value'
    },
    {
      title: 'Amount Paid',
      value: formatCurrency(summary?.amountPaid),
      icon: <CheckCircle size={24} />,
      color: 'success',
      subtitle: `${summary?.paymentSummary?.paid || 0} paid supplies`
    },
    {
      title: 'Amount Due',
      value: formatCurrency(summary?.amountDue),
      icon: <Clock size={24} />,
      color: 'warning',
      subtitle: `${(summary?.paymentSummary?.unpaid || 0) + (summary?.paymentSummary?.partial || 0)} pending`
    },
    {
      title: 'Overdue',
      value: summary?.overdueSummary?.count || 0,
      icon: <AlertTriangle size={24} />,
      color: 'danger',
      subtitle: formatCurrency(summary?.overdueSummary?.amount)
    }
  ]

  return (
    <Fragment>
      <Row>
        {statsData.map((item, index) => (
          <Col key={index} xl='2' lg='4' md='4' sm='6'>
            <Card className='text-center'>
              <CardBody>
                <div className={`avatar p-50 m-0 mb-1 bg-light-${item.color}`}>
                  <div className='avatar-content'>{item.icon}</div>
                </div>
                <h2 className='font-weight-bolder'>{item.value}</h2>
                <p className='card-text font-weight-bold mb-0'>{item.title}</p>
                <small className='text-muted'>{item.subtitle}</small>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    </Fragment>
  )
}

export default StatsCards
