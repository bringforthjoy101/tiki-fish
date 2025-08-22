// ** React Imports
import { useState } from 'react'

// ** Reactstrap Imports
import { Card, CardBody, CardHeader, CardTitle, Table, Badge, Button, UncontrolledTooltip } from 'reactstrap'

// ** Icons
import { TrendingUp, TrendingDown, Package, Info, Calendar, User } from 'react-feather'

// ** Third Party
import moment from 'moment'

const StockHistory = ({ stockHistory = [], product }) => {
  const [showAll, setShowAll] = useState(false)
  
  // Sort by most recent first
  const sortedHistory = [...stockHistory].sort((a, b) => b.id - a.id)
  const displayHistory = showAll ? sortedHistory : sortedHistory.slice(0, 10)

  // Get type badge color
  const getTypeBadge = (type) => {
    switch (type) {
      case 'IN':
        return { color: 'light-success', icon: <TrendingUp size={12} />, text: 'Stock In' }
      case 'OUT':
        return { color: 'light-danger', icon: <TrendingDown size={12} />, text: 'Stock Out' }
      default:
        return { color: 'light-secondary', icon: <Package size={12} />, text: type }
    }
  }

  // Calculate cumulative stock level
  const calculateCumulativeStock = (history, index) => {
    let cumulative = 0
    for (let i = history.length - 1; i >= index; i--) {
      const item = history[i]
      if (item.type === 'IN') {
        cumulative += Number(item.qty)
      } else {
        cumulative -= Number(item.qty)
      }
    }
    return cumulative
  }

  return (
    <Card>
      <CardHeader className='border-bottom'>
        <CardTitle tag='h4'>
          <Package size={20} className='mr-1' />
          Stock Movement History
        </CardTitle>
        <div>
          <Badge color='light-primary' className='mr-1'>
            Current Stock: {product.qty} {product.unit}
          </Badge>
          <Badge color='light-info'>
            {stockHistory.length} transactions
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        {stockHistory.length === 0 ? (
          <div className='text-center py-4'>
            <Package size={48} className='text-muted mb-2' />
            <p className='text-muted'>No stock movements recorded yet</p>
          </div>
        ) : (
          <>
            <div className='table-responsive'>
              <Table hover className='text-nowrap'>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Department</th>
                    <th>Quantity</th>
                    <th>Balance</th>
                    <th>Description</th>
                    <th>By</th>
                  </tr>
                </thead>
                <tbody>
                  {displayHistory.map((history, index) => {
                    const typeInfo = getTypeBadge(history.type)
                    const balance = calculateCumulativeStock(sortedHistory, index)
                    
                    return (
                      <tr key={history.id}>
                        <td>
                          <div className='d-flex align-items-center'>
                            <Calendar size={14} className='mr-1' />
                            <span>{moment(history.createdAt).format('DD MMM YYYY')}</span>
                          </div>
                          <small className='text-muted'>{moment(history.createdAt).format('HH:mm')}</small>
                        </td>
                        <td>
                          <Badge color={typeInfo.color}>
                            {typeInfo.icon} {typeInfo.text}
                          </Badge>
                        </td>
                        <td>
                          <span className='text-capitalize'>{history.department || '-'}</span>
                        </td>
                        <td>
                          <strong className={history.type === 'IN' ? 'text-success' : 'text-danger'}>
                            {history.type === 'IN' ? '+' : '-'}{history.qty} {product.unit}
                          </strong>
                        </td>
                        <td>
                          <Badge color='light-secondary'>
                            {balance} {product.unit}
                          </Badge>
                        </td>
                        <td>
                          <span className='d-inline-block text-truncate' style={{maxWidth: '200px'}}>
                            {history.description || 'No description'}
                          </span>
                          {history.description && history.description.length > 30 && (
                            <>
                              <Info size={14} className='ml-1' id={`desc-${history.id}`} />
                              <UncontrolledTooltip placement='top' target={`desc-${history.id}`}>
                                {history.description}
                              </UncontrolledTooltip>
                            </>
                          )}
                        </td>
                        <td>
                          <div className='d-flex align-items-center'>
                            <User size={14} className='mr-1' />
                            <small>{history.admin?.firstName || 'System'}</small>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
            
            {stockHistory.length > 10 && (
              <div className='text-center mt-2'>
                <Button 
                  color='primary' 
                  outline 
                  size='sm'
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Show Less' : `Show All (${stockHistory.length} records)`}
                </Button>
              </div>
            )}

            {/* Stock Summary Stats */}
            <div className='mt-3 pt-3 border-top'>
              <h6 className='mb-2'>Summary Statistics</h6>
              <div className='d-flex justify-content-around text-center'>
                <div>
                  <p className='mb-0 text-muted small'>Total Inbound</p>
                  <h5 className='mb-0 text-success'>
                    +{sortedHistory.filter(h => h.type === 'IN').reduce((sum, h) => sum + Number(h.qty), 0)} {product.unit}
                  </h5>
                </div>
                <div>
                  <p className='mb-0 text-muted small'>Total Outbound</p>
                  <h5 className='mb-0 text-danger'>
                    -{sortedHistory.filter(h => h.type === 'OUT').reduce((sum, h) => sum + Number(h.qty), 0)} {product.unit}
                  </h5>
                </div>
                <div>
                  <p className='mb-0 text-muted small'>Net Change</p>
                  <h5 className='mb-0'>
                    {sortedHistory.reduce((sum, h) => sum + (h.type === 'IN' ? Number(h.qty) : -Number(h.qty)), 0)} {product.unit}
                  </h5>
                </div>
                <div>
                  <p className='mb-0 text-muted small'>Last Movement</p>
                  <h5 className='mb-0'>
                    {sortedHistory[0] ? moment(sortedHistory[0].createdAt).fromNow() : 'Never'}
                  </h5>
                </div>
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default StockHistory