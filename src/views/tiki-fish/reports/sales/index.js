import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Spinner, Alert, FormGroup, Badge } from 'reactstrap'
import { Printer } from 'react-feather'
import { getSalesReport } from '../store/action'
import SaveSnapshot from '../SaveSnapshot'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

const monthStart = () => {
	const d = new Date()
	return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
const today = () => new Date().toISOString().slice(0, 10)

const monthName = (m) => {
	if (!m) return ''
	const [y, mm] = String(m).split('-').map(Number)
	return new Date(y, mm - 1, 1).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
}

const SalesReport = () => {
	const dispatch = useDispatch()
	const { sales, loading } = useSelector((s) => s.reports)
	const [range, setRange] = useState({ startDate: monthStart(), endDate: today() })

	useEffect(() => {
		dispatch(getSalesReport(range))
	}, [JSON.stringify(range)])

	const set = (field) => (e) => setRange((r) => ({ ...r, [field]: e.target.value || undefined }))

	if (loading && !sales) return <div className="text-center py-3"><Spinner /></div>

	const rc = sales?.reconciles
	const maxRevenue = sales?.byProduct?.[0]?.revenue || 0

	return (
		<div className="sales-report">
			<style>{`
				@media print {
					.no-print, .main-menu, .header-navbar, .footer { display: none !important; }
					.content, .app-content { margin: 0 !important; padding: 0 !important; }
					.card { box-shadow: none !important; border: none !important; }
				}
			`}</style>

			<Card>
				<CardHeader className="d-flex justify-content-between align-items-start flex-wrap">
					<div>
						<CardTitle tag="h4" className="mb-25">What sold</CardTitle>
						<small className="text-muted">
							Every product sold in the period, biggest first. Counts completed and delivered orders only, so it
							agrees with the profit and loss.
						</small>
					</div>
					<div className="d-flex align-items-center">
						<SaveSnapshot reportType="sales" range={range} />
						<Button color="secondary" outline className="no-print ml-1" onClick={() => window.print()}>
							<Printer size={15} /> Print
						</Button>
					</div>
				</CardHeader>

				<CardBody>
					<Row className="mb-1 no-print">
						<Col md="3" sm="6">
							<FormGroup>
								<Label>From</Label>
								<Input type="date" value={range.startDate || ''} onChange={set('startDate')} />
							</FormGroup>
						</Col>
						<Col md="3" sm="6">
							<FormGroup>
								<Label>To</Label>
								<Input type="date" max={today()} value={range.endDate || ''} onChange={set('endDate')} />
							</FormGroup>
						</Col>
					</Row>

					{!sales && <Alert color="danger" className="p-1">Nothing to show.</Alert>}

					{sales && (
						<>
							{/* Product lines cannot equal gross revenue, because delivery belongs to no
							    product. Showing the identity stops that gap being discovered as a
							    discrepancy against the P&L. */}
							<Table size="sm" className="mb-1" style={{ maxWidth: 520 }}>
								<tbody>
									<tr>
										<td>Goods sold ({sales.totals.products} products)</td>
										<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(rc.productLines)}</td>
									</tr>
									<tr>
										<td className="text-muted">Delivery charged <small>(per order, not per product)</small></td>
										<td className="text-right text-nowrap text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(rc.plusDelivery)}</td>
									</tr>
									<tr className="font-weight-bold">
										<td>Total revenue <small className="text-muted">— same figure as the profit and loss</small></td>
										<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(rc.equalsGrossRevenue)}</td>
									</tr>
									{rc.residual !== 0 && (
										<tr className="text-danger">
											<td>Unexplained difference</td>
											<td className="text-right text-nowrap">{naira(rc.residual)}</td>
										</tr>
									)}
								</tbody>
							</Table>

							{rc.residual !== 0 && (
								<Alert color="danger" className="p-1">
									The product lines and the order totals disagree by {naira(rc.residual)}. This screen and the profit
									and loss are showing different sales figures — do not send either until it is explained.
								</Alert>
							)}

							<div className="text-muted mb-1">
								<small>
									{sales.totals.orders.toLocaleString()} orders · {sales.totals.lines.toLocaleString()} lines
								</small>
							</div>

							<Table responsive hover size="sm">
								<thead>
									<tr>
										<th style={{ width: '34%' }}>Product</th>
										<th className="text-right">Quantity</th>
										<th className="text-right">Revenue</th>
										<th className="text-right">Share</th>
										<th style={{ width: '18%' }} />
									</tr>
								</thead>
								<tbody>
									{sales.byProduct.map((p) => (
										<tr key={p.productId}>
											<td>
												{p.name}
												{p.soldAlsoAs.length > 0 && (
													<small className="text-muted d-block">also sold as {p.soldAlsoAs.join(', ')}</small>
												)}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{Number(p.quantity).toLocaleString()} {p.unit || ''}
											</td>
											<td className="text-right text-nowrap font-weight-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{naira(p.revenue)}
											</td>
											<td className="text-right text-nowrap">{p.share}%</td>
											<td>
												<div style={{ background: '#e9ecef', borderRadius: 2, height: 6 }}>
													<div
														style={{
															width: `${maxRevenue ? (p.revenue / maxRevenue) * 100 : 0}%`,
															background: '#7367f0',
															borderRadius: 2,
															height: 6,
														}}
													/>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</Table>

							{sales.byMonth.length > 1 && (
								<>
									<h5 className="mt-2">Month by month</h5>
									<Table size="sm" responsive style={{ maxWidth: 520 }}>
										<thead>
											<tr>
												<th>Month</th>
												<th className="text-right">Orders</th>
												<th className="text-right">Goods sold</th>
											</tr>
										</thead>
										<tbody>
											{sales.byMonth.map((m) => (
												<tr key={m.month}>
													<td>{monthName(m.month)}</td>
													<td className="text-right">{m.orders.toLocaleString()}</td>
													<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
														{naira(m.productRevenue)}
													</td>
												</tr>
											))}
										</tbody>
									</Table>
								</>
							)}

							<hr />
							<h6>What this report cannot tell you</h6>
							<ul className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
								<li>{sales.notes.channel}</li>
								<li>{sales.notes.category}</li>
								<li>{sales.notes.renames}</li>
							</ul>
						</>
					)}
				</CardBody>
			</Card>
		</div>
	)
}

export default SalesReport
