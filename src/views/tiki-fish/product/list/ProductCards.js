import { Card, CardBody, Badge, Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Spinner } from 'reactstrap'
import { Link } from 'react-router-dom'
import { Eye, MoreVertical, Edit, Package } from 'react-feather'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

/**
 * How stock reads against its reorder level.
 *
 * NULL level -> 'unknown', and unknown shows NOTHING. The old rule was a hard-coded `qty < 10`
 * regardless of unit, so 10 kg of catfish and 10 pieces of stick fish warned identically. A
 * storekeeper told everything is low stops reading the warning.
 */
export const stockState = (product) => {
  const qty = Number(product.qty) || 0
  if (qty <= 0) return { key: 'out', color: 'light-danger', label: 'Out of stock' }
  const level = product.reorderLevel
  if (level === null || level === undefined) return { key: 'unknown', color: 'light-secondary', label: null }
  if (qty <= Number(level)) return { key: 'low', color: 'light-warning', label: 'Low — reorder' }
  return { key: 'ok', color: 'light-success', label: null }
}

/**
 * One product, as a card.
 *
 * Stock and price lead, because the question this screen answers at a counter is "do we have it
 * and what does it cost". Cost and margin appear only when the API actually sent them — a rep
 * without products.readCost never receives the fields at all.
 */
const ProductCard = ({ product, canEdit }) => {
  const state = stockState(product)
  // costHidden comes from the API. Checking it — rather than testing for a falsy costPrice —
  // keeps "we are not allowed to see this" separate from "this genuinely costs nothing".
  const showMoney = !product.costHidden && product.costPrice !== undefined
  const totalCost = Number(product.costPrice || 0) + Number(product.smokeHousePrice || 0) + Number(product.packagingPrice || 0)
  const margin = totalCost > 0 ? ((Number(product.price || 0) - totalCost) / totalCost) * 100 : null

  return (
    <Card className="mb-1">
      <CardBody className="p-1">
        <div className="d-flex justify-content-between align-items-start">
          <div className="min-width-0 mr-1">
            <Link to={`/product/view/${product.id}`} className="font-weight-bolder d-block text-truncate">
              {product.name}
            </Link>
            <small className="text-muted text-capitalize">{product.category}</small>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-weight-bolder" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {naira(product.price)}
            </div>
            <small className="text-muted">per {product.unit}</small>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-1">
          <div>
            <Badge color={state.color} pill>
              <Package size={12} /> <span className="align-middle">{Number(product.qty).toLocaleString()} {product.unit}</span>
            </Badge>
            {state.label && <div className={`small mt-25 text-${state.color.replace('light-', '')}`}>{state.label}</div>}
            {state.key === 'unknown' && (
              <div className="small text-muted mt-25">No reorder level set</div>
            )}
          </div>

          <div className="d-flex align-items-center flex-shrink-0">
            {showMoney && margin !== null && (
              <div className="text-right mr-1">
                <Badge color={margin > 30 ? 'light-success' : margin > 15 ? 'light-warning' : 'light-danger'}>
                  {margin.toFixed(0)}%
                </Badge>
                <div className="small text-muted">cost {naira(totalCost)}</div>
              </div>
            )}
            <Button tag={Link} to={`/product/view/${product.id}`} color="flat-primary" size="sm" className="btn-icon">
              <Eye size={16} />
            </Button>
            {canEdit && (
              <UncontrolledDropdown>
                <DropdownToggle tag="div" className="btn btn-sm p-50">
                  <MoreVertical size={16} className="cursor-pointer" />
                </DropdownToggle>
                <DropdownMenu right>
                  <DropdownItem tag={Link} to={`/product/view/${product.id}`}>
                    <Eye size={14} className="mr-50" /> View
                  </DropdownItem>
                  <DropdownItem tag={Link} to={`/product/edit/${product.id}`}>
                    <Edit size={14} className="mr-50" /> Edit
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

const ProductCards = ({ products, breakpoint, canEdit, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-3">
        <Spinner />
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="text-center py-3 text-muted">
        <p className="mb-0">No products match what you are looking for.</p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: breakpoint === 'tablet' ? '1fr 1fr' : '1fr',
        gap: '0.5rem'
      }}
    >
      {products.map(p => (
        <ProductCard key={p.id} product={p} canEdit={canEdit} />
      ))}
    </div>
  )
}

export default ProductCards
