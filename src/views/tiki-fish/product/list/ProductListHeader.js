// ** React Imports
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

// ** Reactstrap Imports
import { Card, CardBody, Col, Row } from 'reactstrap'

// ** Icons
import { Package, DollarSign, AlertTriangle, TrendingDown } from 'react-feather'
import { stockState } from './ProductCards'

const ProductListHeader = () => {
  const store = useSelector(state => state.products)
  const products = store.allData || []
  
  // Calculate statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStock: 0,
    noLevelSet: 0,
    outOfStock: 0
  })

  useEffect(() => {
    if (products.length > 0) {
      const totalProducts = products.length
      const totalValue = products.reduce((sum, product) => {
        return sum + (Number(product.qty) * Number(product.price))
      }, 0)
      // Against each product's OWN reorder level, not a flat 10. A product with no level set
      // counts as neither low nor fine — it is simply not known, and guessing would make most of
      // the 124 products warn on day one, which trains people to ignore the warning.
      const lowStock = products.filter(p => stockState(p).key === 'low').length
      const noLevelSet = products.filter(p => stockState(p).key === 'unknown').length
      const outOfStock = products.filter(p => Number(p.qty) === 0).length

      setStats({
        totalProducts,
        totalValue,
        lowStock,
        outOfStock,
        noLevelSet
      })
    }
  }, [products])
  // if/else, not a ternary: .eslintrc.js sets multiline-ternary to ['error', 'never'], so a
  // ternary may not wrap AT ALL — hoisting it out of the object literal is not enough, and CRA
  // fails the build on it rather than warning.
  let lowStockSubtitle = 'at or below their reorder level'
  if (stats.noLevelSet) {
    const s = stats.noLevelSet === 1 ? '' : 's'
    lowStockSubtitle = `at or below reorder level · ${stats.noLevelSet} product${s} have no level set`
  }


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
      // The subtitle has to change with the rule. It promised "< 10 units" while the count had
      // moved to each product's own reorder level — and since migration 034 seeds nothing, the
      // number is structurally 0 until levels are set. A zero under a stale promise reads as
      // "all good"; naming the products with no level set is what makes it actionable.
      title: 'Low Stock Alert',
      value: stats.lowStock,
      subtitle: lowStockSubtitle,
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