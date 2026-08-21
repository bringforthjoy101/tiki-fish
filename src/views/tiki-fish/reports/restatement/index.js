import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Table, Spinner, Alert, Button, Badge } from 'reactstrap'
import { Printer } from 'react-feather'
import { getRestatement } from '../store/action'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const Restatement = () => {
	const dispatch = useDispatch()
	const { restatement, loading } = useSelector((s) => s.reports)

	useEffect(() => {
		dispatch(getRestatement())
	}, [])

	if (loading && !restatement) return <div className="text-center py-3"><Spinner /></div>
	if (!restatement) return <Alert color="danger" className="p-1">Nothing to show.</Alert>

	const w = restatement.whichOrdersCount
	const col = restatement.whichColumnIsRevenue
	const led = restatement.ledgerExceptions
	const rec = restatement.reconciles

	return (
		<div className="restatement">
			<style>{`
				@media print {
					.no-print, .main-menu, .header-navbar, .footer { display: none !important; }
					.content, .app-content { margin: 0 !important; padding: 0 !important; }
					.card { box-shadow: none !important; border: none !important; }
				}
			`}</style>

			<Card>
				<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
					<div>
						<CardTitle tag="h4" className="mb-25">What changed, and why</CardTitle>
						<small className="text-muted">
							How the figures restate now that revenue is counted the agreed way
						</small>
					</div>
					<Button color="secondary" outline className="no-print" onClick={() => window.print()}>
						<Printer size={15} /> Print
					</Button>
				</CardHeader>

				<CardBody>
					<Alert color="info" className="p-1">
						Three separate things changed at once. They are shown separately on purpose — added
						together they look like one unexplained movement, and the point of this page is that
						nothing is unexplained.
					</Alert>

					{/* 1 */}
					<h5 className="mt-2">1. Which orders count as a sale</h5>
					<p className="text-muted mb-1">
						Previously every order counted except cancelled ones. Now only <b>completed</b> and{' '}
						<b>delivered</b> orders do — an order that was never finished is not a sale.
					</p>
					<Table responsive size="sm" className="mb-1">
						<tbody>
							<tr>
								<td>{w.oldBasis.label}</td>
								<td className="text-right">{w.oldBasis.orders} orders</td>
								<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(w.oldBasis.gross)}</td>
							</tr>
							<tr>
								<td>{w.newBasis.label}</td>
								<td className="text-right">{w.newBasis.orders} orders</td>
								<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(w.newBasis.gross)}</td>
							</tr>
							<tr className="font-weight-bold">
								<td>Leaves revenue</td>
								<td className="text-right">{w.ordersDropped} orders</td>
								<td className="text-right text-nowrap text-danger" style={{ fontVariantNumeric: 'tabular-nums' }}>−{naira(w.grossDropped)}</td>
							</tr>
						</tbody>
					</Table>

					{/* Listed, not summarised. Somebody will want to look one up. */}
					<details>
						<summary className="text-primary" style={{ cursor: 'pointer' }}>
							Show all {w.excludedOrders.length} orders that no longer count
						</summary>
						<div style={{ overflowX: 'auto', maxHeight: '20rem' }} className="mt-1">
							<Table responsive hover size="sm">
								<thead>
									<tr><th>Order</th><th>Date</th><th>Status</th><th className="text-right">Value</th></tr>
								</thead>
								<tbody>
									{w.excludedOrders.map((o) => (
										<tr key={o.id}>
											<td className="font-weight-bold">{o.orderNumber}</td>
											<td className="text-nowrap">{readable(o.date)}</td>
											<td><Badge color="light-secondary">{o.status}</Badge></td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(o.gross)}</td>
										</tr>
									))}
								</tbody>
							</Table>
						</div>
					</details>

					{/* 2 */}
					<h5 className="mt-2">2. Which figure on the order is the sale</h5>
					<p className="text-muted mb-1">
						Revenue is now the order's own line total plus delivery, before any discount — and the
						discount is charged as a cost to Sales rather than quietly reducing the sale.
					</p>
					<Table responsive size="sm" className="mb-1">
						<tbody>
							<tr><td>{col.oldColumn.label}</td><td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(col.oldColumn.total)}</td></tr>
							<tr><td>{col.newColumn.label}</td><td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(col.newColumn.total)}</td></tr>
						</tbody>
					</Table>
					{col.corruptedCount > 0 && (
						<Alert color="warning" className="p-1">
							<b>{col.corruptedCount} orders have a total that does not match their own contents</b>, by {naira(col.corruptedGap)} altogether.
							This is a fault in how those orders were saved, not part of the change above — and it is still happening.
						</Alert>
					)}

					{/* The proof */}
					{rec && (
						<div className="border rounded p-1 mb-1">
							<div className="font-weight-bold mb-25">Does that account for the whole difference?</div>
							<Table responsive size="sm" className="mb-0">
								<tbody>
									<tr><td>Old total</td><td className="text-right text-nowrap">{naira(rec.amount)}</td></tr>
									<tr><td className="text-muted pl-2">add back discounts, now a cost</td><td className="text-right text-nowrap text-muted">{naira(rec.plusDiscountNowACost)}</td></tr>
									<tr><td className="text-muted pl-2">remove the saving fault above</td><td className="text-right text-nowrap text-muted">−{naira(rec.lessAmountCorruption)}</td></tr>
									<tr className="font-weight-bold"><td>New total</td><td className="text-right text-nowrap">{naira(rec.equalsGrossRevenue)}</td></tr>
									<tr>
										<td className={Math.abs(rec.residual) < 0.01 ? 'text-success' : 'text-danger'}>
											{Math.abs(rec.residual) < 0.01 ? 'Nothing left unexplained' : 'Unexplained difference'}
										</td>
										<td className={`text-right text-nowrap ${Math.abs(rec.residual) < 0.01 ? 'text-success' : 'text-danger'}`}>{naira(rec.residual)}</td>
									</tr>
								</tbody>
							</Table>
						</div>
					)}

					{/* 3 */}
					<h5 className="mt-2">3. Where the old ledger disagrees</h5>
					<Row>
						<Col md="6">
							<div className="border rounded p-1 h-100">
								<div className="font-weight-bold">{led.earnedButNeverBooked.length} sales never reached the ledger</div>
								<small className="text-muted">They earned revenue and no entry was ever written.</small>
								{led.earnedButNeverBooked.slice(0, 8).map((o) => (
									<div key={o.id} className="mt-25">
										<b>{o.orderNumber}</b> <span className="text-muted">{readable(o.date)}</span>{' '}
										<span className="float-right">{naira(o.gross)}</span>
									</div>
								))}
							</div>
						</Col>
						<Col md="6">
							<div className="border rounded p-1 h-100">
								<div className="font-weight-bold">{led.bookedButNoLongerRevenue.length} entries for orders that are no longer sales</div>
								<small className="text-muted">
									Nothing reverses a ledger entry when an order stops being completed, so these sit there permanently.
								</small>
								{led.bookedButNoLongerRevenue.slice(0, 8).map((o) => (
									<div key={o.id} className="mt-25">
										<b>{o.orderNumber}</b> <Badge color="light-secondary">{o.status}</Badge>{' '}
										<span className="float-right">{naira(o.gross)}</span>
									</div>
								))}
							</div>
						</Col>
					</Row>

					{/* by month */}
					<h5 className="mt-2">Month by month</h5>
					<div style={{ overflowX: 'auto' }}>
						<Table responsive hover size="sm">
							<thead>
								<tr>
									<th>Month</th>
									<th className="text-right">Was</th>
									<th className="text-right">Now</th>
									<th className="text-right">Difference</th>
								</tr>
							</thead>
							<tbody>
								{restatement.byMonth.map((m) => (
									<tr key={m.month}>
										<td>{m.month}</td>
										<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
											{naira(m.oldGross)}<small className="text-muted d-block">{m.oldOrders} orders</small>
										</td>
										<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
											{naira(m.newGross)}<small className="text-muted d-block">{m.newOrders} orders</small>
										</td>
										<td className={`text-right text-nowrap ${m.grossDropped ? 'text-danger' : 'text-muted'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
											{m.grossDropped ? `−${naira(m.grossDropped)}` : '—'}
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					</div>
				</CardBody>
			</Card>
		</div>
	)
}

export default Restatement
