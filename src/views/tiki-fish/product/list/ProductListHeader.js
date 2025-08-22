// ** React Imports
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

// ** Reactstrap Imports
import { Card, CardBody, Col, Row } from 'reactstrap'

// ** Icons
import { Package, DollarSign, AlertTriangle, TrendingDown } from 'react-feather'

const ProductListHeader = () => {
  const store = useSelector(state => state.products)
  const products = store.allData || []
  
  // Calculate statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0
  })

  useEffect(() => {
    if (products.length > 0) {
      const totalProducts = products.length
      const totalValue = products.reduce((sum, product) => {
        return sum + (Number(product.qty) * Number(product.price))
      }, 0)
      const lowStock = products.filter(p => Number(p.qty) > 0 && Number(p.qty) < 10).length
      const outOfStock = products.filter(p => Number(p.qty) === 0).length

      setStats({
        totalProducts,
        totalValue,
        lowStock,
        outOfStock
      })
    }
  }, [products])

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      subtitle: 'Active products',
      color: 'primary',
      icon: <Package size={24} />
    },
    {
      title: 'Inventory Value',
      value: stats.totalValue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' }),
      subtitle: 'Total stock value',
      color: 'success',
      icon: <DollarSign size={24} />
    },
    {
      title: 'Low Stock Alert',
      value: stats.lowStock,
      subtitle: 'Products < 10 units',
      color: 'warning',
      icon: <AlertTriangle size={24} />
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStock,
      subtitle: 'Need restocking',
      color: 'danger',
      icon: <TrendingDown size={24} />
    }
  ]

  return (
    <Row className='mb-2'>
      {statCards.map((card, index) => (
        <Col lg='3' sm='6' key={index}>
          <Card>
            <CardBody>
              <div className='d-flex justify-content-between align-items-center'>
                <div>
                  <p className='mb-0 text-muted'>{card.title}</p>
                  <h3 className='mb-0 font-weight-bold'>{card.value}</h3>
                  <small className='text-muted'>{card.subtitle}</small>
                </div>
                <div className={`avatar avatar-stats p-50 bg-light-${card.color}`}>
                  <div className='avatar-content'>
                    {card.icon}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default ProductListHeader