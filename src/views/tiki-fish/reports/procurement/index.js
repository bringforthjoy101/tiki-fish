import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Spinner, Alert, FormGroup, Badge } from 'reactstrap'
import { Printer, AlertTriangle } from 'react-feather'
import { getProcurementReport } from '../store/action'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

const yearStart = () => `${new Date().getFullYear()}-01-01`
const today = () => new Date().toISOString().slice(0, 10)

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}
const monthName = (m) => {
	if (!m) return ''
	const [y, mm] = String(m).split('-').map(Number)
	return new Date(y, mm - 1, 1).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
}

const STATUS_COLOUR = { paid: 'light-success', partial: 'light-warning', unpaid: 'light-danger' }

const ProcurementReport = () => {
	const dispatch = useDispatch()
	const { procurement, loading } = useSelector((s) => s.reports)
	const [range, setRange] = useState({ startDate: yearStart(), endDate: today() })

	useEffect(() => {
		dispatch(getProcurementReport(range))
	}, [JSON.stringify(range)])

	const set = (field) => (e) => setRange((r) => ({ ...r, [field]: e.target.value || undefined }))

	if (loading && !procurement) return <div className="text-center py-3"><Spinner /></div>

	const h = procurement?.history
	const c = procurement?.current
	const owed = procurement?.owed

	return (
		<div className="procurement-report">
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
						<CardTitle tag="h4" className="mb-25">What fish cost</CardTitle>
						<small className="text-muted">What was bought, from whom, and what is still owed for it.</small>
					</div>
					<Button color="secondary" outline className="no-print" onClick={() => window.print()}>
						<Printer size={15} /> Print
					</Button>
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

					{!procurement && <Alert color="danger" className="p-1">Nothing to show.</Alert>}

					{procurement && (
						<>
							{/* Owed first. It is the only figure here that needs acting on. */}
							{owed.total > 0 && (
								<Alert color="warning" className="p-1">
									<div className="d-flex">
										<div className="mr-1"><AlertTriangle size={18} /></div>
										<div>
											<strong>{naira(owed.total)} is still owed to fish suppliers.</strong>
											<div>
												{naira(owed.billed)} billed, {naira(owed.paid)} paid.
												{owed.oldest && (
													<>
														{' '}The longest outstanding is {naira(owed.oldest.owing)} to {owed.oldest.supplier}, from{' '}
														{readable(owed.oldest.supplyDate)} — <b>{owed.oldest.daysOutstanding} days ago</b>.
													</>
												)}
											</div>
										</div>
									</div>
								</Alert>
							)}

							<Row className="mb-2">
								<Col md="4" sm="6">
									<div className="text-muted" style={{ fontSize: '0.75rem' }}>Fish bought — {h.label.toLowerCase()}</div>
									<div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{naira(h.goodsCost)}</div>
									<small className="text-muted">{h.rows} purchases, {readable(h.firstDate)} to {readable(h.lastDate)}</small>
								</Col>
								<Col md="4" sm="6">
									<div className="text-muted" style={{ fontSize: '0.75rem' }}>Paid</div>
									<div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{naira(owed.paid)}</div>
								</Col>
								<Col md="4" sm="6">
									<div className="text-muted" style={{ fontSize: '0.75rem' }}>Still owed</div>
									<div style={{ fontWeight: 600, fontSize: '1.2rem' }} className={owed.total > 0 ? 'text-warning' : ''}>
										{naira(owed.total)}
									</div>
								</Col>
							</Row>

							<h5>Where it stands</h5>
							<Table size="sm" style={{ maxWidth: 560 }}>
								<thead>
									<tr>
										<th>Status</th>
										<th className="text-right">Bills</th>
										<th className="text-right">Billed</th>
										<th className="text-right">Still owed</th>
									</tr>
								</thead>
								<tbody>
									{h.byStatus.map((r) => (
										<tr key={r.paymentStatus}>
											<td><Badge color={STATUS_COLOUR[r.paymentStatus] || 'light-secondary'}>{r.paymentStatus}</Badge></td>
											<td className="text-right">{r.rows}</td>
											<td className="text-right text-nowrap">{naira(r.billed)}</td>
											<td className="text-right text-nowrap">{naira(r.outstanding)}</td>
										</tr>
									))}
								</tbody>
							</Table>

							<h5 className="mt-2">By supplier</h5>
							<Table responsive hover size="sm">
								<thead>
									<tr>
										<th>Supplier</th>
										<th className="text-right">Purchases</th>
										<th className="text-right">Billed</th>
										<th className="text-right">Still owed</th>
									</tr>
								</thead>
								<tbody>
									{h.bySupplier.map((r) => (
										<tr key={r.supplierId}>
											<td>{r.name}</td>
											<td className="text-right">{r.rows}</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(r.billed)}</td>
											<td className={`text-right text-nowrap ${r.outstanding > 0 ? 'text-warning font-weight-bold' : 'text-muted'}`}>
												{r.outstanding > 0 ? naira(r.outstanding) : '—'}
											</td>
										</tr>
									))}
								</tbody>
							</Table>

							{h.byMonth.length > 1 && (
								<>
									<h5 className="mt-2">Month by month</h5>
									<Table size="sm" style={{ maxWidth: 460 }}>
										<thead>
											<tr>
												<th>Month</th>
												<th className="text-right">Purchases</th>
												<th className="text-right">Billed</th>
											</tr>
										</thead>
										<tbody>
											{h.byMonth.map((m) => (
												<tr key={m.month}>
													<td>{monthName(m.month)}</td>
													<td className="text-right">{m.rows}</td>
													<td className="text-right text-nowrap">{naira(m.billed)}</td>
												</tr>
											))}
										</tbody>
									</Table>
								</>
							)}

							<h5 className="mt-2">What was bought</h5>
							<Table responsive size="sm">
								<thead>
									<tr>
										<th>Item, as it was typed</th>
										<th className="text-right">Purchases</th>
										<th className="text-right">Billed</th>
									</tr>
								</thead>
								<tbody>
									{h.byItem.map((r) => (
										<tr key={r.name}>
											<td>{r.name}</td>
											<td className="text-right">{r.rows}</td>
											<td className="text-right text-nowrap">{naira(r.billed)}</td>
										</tr>
									))}
								</tbody>
							</Table>

							{/* Never added to the history figure above — see the endpoint header. */}
							<h5 className="mt-2">New-style purchases</h5>
							{c.rows === 0 && (
								<Alert color="primary" className="p-1">
									No purchases have been recorded the new way yet
									{c.cancelledExcluded > 0 ? `, and ${c.cancelledExcluded} was cancelled` : ''}. Once they are, this section
									shows transport and handling as well as the fish itself — which the older records above do not carry.
								</Alert>
							)}
							{c.rows > 0 && (
								<Table size="sm" style={{ maxWidth: 460 }}>
									<tbody>
										<tr><td>Fish</td><td className="text-right text-nowrap">{naira(c.goods)}</td></tr>
										<tr><td className="text-muted">Transport</td><td className="text-right text-nowrap text-muted">{naira(c.transport)}</td></tr>
										<tr><td className="text-muted">Handling</td><td className="text-right text-nowrap text-muted">{naira(c.handling)}</td></tr>
										<tr><td className="text-muted">Other</td><td className="text-right text-nowrap text-muted">{naira(c.other)}</td></tr>
										<tr className="font-weight-bold"><td>Landed cost ({c.rows} purchases)</td><td className="text-right text-nowrap">{naira(c.totalLandedCost)}</td></tr>
									</tbody>
								</Table>
							)}

							<hr />
							<h6>What this report cannot tell you</h6>
							<ul className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
								<li>{procurement.notes.costPerKg}</li>
								<li>{procurement.notes.lossRate}</li>
								<li>{procurement.notes.naming}</li>
								<li>{procurement.notes.twoEras}</li>
							</ul>
						</>
					)}
				</CardBody>
			</Card>
		</div>
	)
}

export default ProcurementReport
