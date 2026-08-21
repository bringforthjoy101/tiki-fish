import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Spinner, Alert, FormGroup, Badge } from 'reactstrap'
import { Printer } from 'react-feather'
import { getProfitAndLoss } from '../store/action'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const signed = (n) => `${Number(n) < 0 ? '−' : ''}${naira(Math.abs(Number(n) || 0))}`

const monthStart = () => {
	const d = new Date()
	return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
const today = () => new Date().toISOString().slice(0, 10)

const readable = (s) => {
	if (!s) return 'all time'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** One line of the statement. `strong` for subtotals, `muted` for the components above them. */
const Line = ({ label, value, strong, muted, note }) => (
	<tr>
		<td className={strong ? 'font-weight-bold' : muted ? 'text-muted pl-2' : ''}>
			{label}
			{note && <small className="text-muted d-block">{note}</small>}
		</td>
		<td
			className={`text-right text-nowrap ${strong ? 'font-weight-bold' : muted ? 'text-muted' : ''} ${Number(value) < 0 ? 'text-danger' : ''}`}
			style={{ fontVariantNumeric: 'tabular-nums' }}
		>
			{value === null || value === undefined ? '—' : signed(value)}
		</td>
	</tr>
)

const ProfitAndLoss = () => {
	const dispatch = useDispatch()
	const { pnl, loading } = useSelector((s) => s.reports)
	const [range, setRange] = useState({ startDate: monthStart(), endDate: today() })

	useEffect(() => {
		dispatch(getProfitAndLoss(range))
	}, [JSON.stringify(range)])

	const set = (field) => (e) => setRange((r) => ({ ...r, [field]: e.target.value || undefined }))

	if (loading && !pnl) return <div className="text-center py-3"><Spinner /></div>

	const c = pnl?.coverage

	return (
		<div className="pnl-report">
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
						<CardTitle tag="h4" className="mb-25">Profit and loss</CardTitle>
						<small className="text-muted">
							{readable(pnl?.period?.startDate)} to {readable(pnl?.period?.endDate)}
							{pnl?.revenue ? ` · ${pnl.revenue.orders} orders` : ''}
						</small>
					</div>
					<Button color="secondary" outline className="no-print" onClick={() => window.print()}>
						<Printer size={15} /> Print
					</Button>
				</CardHeader>

				<CardBody>
					<Row className="mb-1 no-print">
						<Col md="3">
							<FormGroup>
								<Label>From</Label>
								<Input type="date" value={range.startDate || ''} onChange={set('startDate')} />
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>To</Label>
								<Input type="date" max={today()} value={range.endDate || ''} onChange={set('endDate')} />
							</FormGroup>
						</Col>
					</Row>

					{/* Deliberately NOT no-print, and deliberately above the numbers. The whole
					    purpose of this block is that nobody reads the profit line without it. */}
					{c?.message && (
						<Alert color={c.isComplete ? 'info' : 'warning'} className="p-1">
							<b>{c.isComplete ? 'Worth knowing' : 'This is not a complete picture'}</b>
							<div>{c.message}</div>
							<small className="d-block mt-25">
								{c.spendRows} spending {c.spendRows === 1 ? 'entry' : 'entries'} recorded
								{c.monthsInPeriod ? ` · ${c.monthsWithSpend} of ${c.monthsInPeriod} months have any` : ''}
								{c.concentration !== null && c.concentration !== undefined ? ` · heaviest month is ${c.concentration}% of all spending` : ''}
							</small>
						</Alert>
					)}

					{pnl && (
						<Table responsive size="sm" className="mb-1">
							<tbody>
								<Line label="Revenue" value={pnl.revenue.gross} strong note={pnl.revenue.basis} />

								<Line label="Cost of goods sold" value={-pnl.costOfSales.costOfGoods} muted />
								<Line label="Packaging" value={-pnl.costOfSales.packaging} muted />
								<Line label="Smokehouse" value={-pnl.costOfSales.smokeHouse} muted />
								<Line label="Logistics" value={-pnl.costOfSales.logistics} muted />
								<Line label="Discounts given" value={-pnl.costOfSales.discount} muted note="Charged to Sales, not deducted from revenue" />

								<Line label="Gross profit" value={pnl.grossProfit} strong />

								<Line
									label="Running costs"
									value={-pnl.operating.total}
									muted
									note={`${pnl.operating.byDepartment.length} department(s), ${pnl.operating.byCategory.length} categor(y/ies)`}
								/>

								<Line
									label="Net profit"
									value={pnl.netProfit}
									strong
									note={pnl.netProfit === null ? 'Withheld — the cost side is incomplete for this period' : null}
								/>
							</tbody>
						</Table>
					)}

					{pnl && (pnl.drawings.total > 0 || pnl.capitalised.total > 0) && (
						<Alert color="light" className="p-1 border">
							<b>Reported separately, not counted as costs</b>
							<div className="mt-25">
								{pnl.drawings.total > 0 && (
									<div>
										Owner drawings <b>{naira(pnl.drawings.total)}</b> across {pnl.drawings.entries} entries — money taken
										out of the business, not a cost of running it.
									</div>
								)}
								{pnl.capitalised.total > 0 && (
									<div>
										Capital items <b>{naira(pnl.capitalised.total)}</b> across {pnl.capitalised.entries} entries — assets,
										so they do not fall on one month.
									</div>
								)}
							</div>
						</Alert>
					)}

					{pnl?.operating?.byDepartment?.length > 0 && (
						<Row>
							<Col md="6">
								<h5 className="mt-1">Where the money went — by department</h5>
								<Table responsive hover size="sm">
									<tbody>
										{pnl.operating.byDepartment.map((d) => (
											<tr key={d.departmentId || d.name}>
												<td>{d.name}<small className="text-muted d-block">{d.entries} entries</small></td>
												<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(d.spend)}</td>
											</tr>
										))}
									</tbody>
								</Table>
							</Col>
							<Col md="6">
								<h5 className="mt-1">By category</h5>
								<Table responsive hover size="sm">
									<tbody>
										{pnl.operating.byCategory.slice(0, 12).map((cat) => (
											<tr key={cat.categoryId || cat.name}>
												<td>
													{cat.name}
													{cat.name === 'Unclassified' && (
														<Badge color="light-warning" className="ml-50">not attributed</Badge>
													)}
												</td>
												<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(cat.spend)}</td>
											</tr>
										))}
									</tbody>
								</Table>
							</Col>
						</Row>
					)}

					{c?.linesMissingSmokeHouseStandard > 0 && (
						<small className="text-muted d-block mt-1">
							{c.linesMissingSmokeHouseStandard} of {c.totalLines} order lines have no smokehouse cost recorded against
							them, so the smokehouse figure above is lower than the truth and the margin is higher by the same amount.
						</small>
					)}
				</CardBody>
			</Card>
		</div>
	)
}

export default ProfitAndLoss
