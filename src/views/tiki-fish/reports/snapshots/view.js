import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle, Table, Spinner, Alert, Badge, Button, Row, Col } from 'reactstrap'
import { Printer, ArrowLeft, AlertTriangle, CheckCircle } from 'react-feather'
import { getSnapshot, clearSnapshot } from '../store/action'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const signed = (n) => `${Number(n) < 0 ? '−' : ''}${naira(Math.abs(Number(n) || 0))}`

const TYPE_LABEL = { pnl: 'Profit and loss', departments: 'By department', restatement: 'What changed, and why', sales: 'What sold' }

const readable = (s) => {
	if (!s) return null
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}
const stamp = (s) => (s ? new Date(s).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

const Line = ({ label, value, strong, muted }) => (
	<tr>
		<td className={strong ? 'font-weight-bold' : muted ? 'text-muted pl-2' : ''}>{label}</td>
		<td
			className={`text-right text-nowrap ${strong ? 'font-weight-bold' : muted ? 'text-muted' : ''} ${Number(value) < 0 ? 'text-danger' : ''}`}
			style={{ fontVariantNumeric: 'tabular-nums' }}
		>
			{value === null || value === undefined ? '—' : signed(value)}
		</td>
	</tr>
)

/**
 * The three reports share no payload shape at all, so each gets its own reader. A generic
 * key-and-value dump would render without erroring and be unreadable, which is the opposite of
 * the point — this is the copy somebody sends to an accountant.
 */
const FrozenPnl = ({ p }) => (
	<>
		<Table size="sm" className="mb-1">
			<tbody>
				<Line label={`Revenue (${p.revenue?.orders || 0} orders)`} value={p.revenue?.gross} strong />
				<Line label="Fish" value={-(p.costOfSales?.costOfGoods || 0)} muted />
				<Line label="Packaging" value={-(p.costOfSales?.packaging || 0)} muted />
				<Line label="Smokehouse" value={-(p.costOfSales?.smokeHouse || 0)} muted />
				<Line label="Discounts given" value={-(p.costOfSales?.discount || 0)} muted />
				<Line label="Gross profit" value={p.grossProfit} strong />
				<Line label="Running costs" value={-(p.operating?.total || 0)} />
				<Line label="Net profit" value={p.netProfit} strong />
			</tbody>
		</Table>
		{(p.netProfitProvisional || p.netProfit === null) && (
			<Alert color="warning" className="p-1">
				<strong>Costs are incomplete for this period.</strong> {p.coverage?.message}
			</Alert>
		)}
	</>
)

const FrozenDepartments = ({ p }) => (
	<Table size="sm" responsive>
		<thead>
			<tr>
				<th>Department</th>
				<th className="text-right">Earned</th>
				<th className="text-right">Spent</th>
				<th className="text-right">Result</th>
			</tr>
		</thead>
		<tbody>
			{(p.departments || []).map((d) => (
				<tr key={d.departmentId} className={d.comparable ? '' : 'text-muted'}>
					<td>
						{d.name}
						{!d.comparable && <small className="d-block text-muted">{d.caveat}</small>}
					</td>
					<td className="text-right text-nowrap">{naira(d.recovery)}</td>
					<td className="text-right text-nowrap">{naira(d.actual)}</td>
					<td className={`text-right text-nowrap ${Number(d.result) < 0 ? 'text-danger' : ''}`}>
						{d.comparable ? signed(d.result) : '—'}
					</td>
				</tr>
			))}
			<tr className="font-weight-bold">
				<td>Comparable total ({p.comparableTotal?.departments || 0} departments)</td>
				<td className="text-right text-nowrap">{naira(p.comparableTotal?.recovery)}</td>
				<td className="text-right text-nowrap">{naira(p.comparableTotal?.actual)}</td>
				<td className="text-right text-nowrap">{signed(p.comparableTotal?.result)}</td>
			</tr>
		</tbody>
	</Table>
)

const FrozenSales = ({ p }) => (
	<>
		<Table size="sm" className="mb-1" style={{ maxWidth: 520 }}>
			<tbody>
				<Line label={`Goods sold (${p.totals?.products || 0} products)`} value={p.reconciles?.productLines} />
				<Line label="Delivery charged" value={p.reconciles?.plusDelivery} muted />
				<Line label="Total revenue" value={p.reconciles?.equalsGrossRevenue} strong />
			</tbody>
		</Table>
		{/* The live screen refuses to be trusted when this is non-zero; a saved copy that dropped
		    the warning would be the version somebody actually sends. */}
		{Number(p.reconciles?.residual) !== 0 && (
			<Alert color="danger" className="p-1">
				When this was saved, the product lines and the order totals disagreed by{' '}
				{naira(p.reconciles.residual)}. The figures below did not reconcile to the profit and loss.
			</Alert>
		)}
		<Table size="sm" responsive>
			<thead>
				<tr>
					<th>Product</th>
					<th className="text-right">Quantity</th>
					<th className="text-right">Revenue</th>
					<th className="text-right">Share</th>
				</tr>
			</thead>
			<tbody>
				{(p.byProduct || []).map((r) => (
					<tr key={r.productId}>
						<td>{r.name}</td>
						<td className="text-right text-nowrap">
							{Number(r.quantity).toLocaleString()} {r.unit || ''}
						</td>
						<td className="text-right text-nowrap">{naira(r.revenue)}</td>
						<td className="text-right text-nowrap">{r.share}%</td>
					</tr>
				))}
			</tbody>
		</Table>
	</>
)

const FrozenRestatement = ({ p }) => (
	<Table size="sm" className="mb-0">
		<tbody>
			<Line label={`Old basis — ${p.whichOrdersCount?.oldBasis?.label}`} value={p.whichOrdersCount?.oldBasis?.gross} />
			<Line label={`New basis — ${p.whichOrdersCount?.newBasis?.label}`} value={p.whichOrdersCount?.newBasis?.gross} />
			<Line label={`Orders no longer counted (${p.whichOrdersCount?.ordersDropped || 0})`} value={-(p.whichOrdersCount?.grossDropped || 0)} muted />
			<Line label="Reported revenue" value={p.reconciles?.equalsGrossRevenue} strong />
			<Line label="Unexplained difference" value={p.reconciles?.residual} strong />
		</tbody>
	</Table>
)

const SnapshotView = () => {
	const dispatch = useDispatch()
	const { id } = useParams()
	const { snapshot: wrapper, loading } = useSelector((s) => s.reports)

	useEffect(() => {
		dispatch(getSnapshot(id))
		return () => dispatch(clearSnapshot())
	}, [id])

	if (loading && !wrapper) return <div className="text-center py-3"><Spinner /></div>
	if (!wrapper?.snapshot) return <Alert color="danger" className="p-1">That saved report could not be found.</Alert>

	const s = wrapper.snapshot
	const drift = wrapper.drift
	const p = s.payload || {}
	const covered = !s.periodStart && !s.periodEnd ? 'All time' : `${readable(s.periodStart) || 'the start'} to ${readable(s.periodEnd) || 'today'}`

	return (
		<div className="snapshot-view">
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
						<CardTitle tag="h4" className="mb-25">
							{TYPE_LABEL[s.reportType] || s.reportType} <Badge color="light-secondary">saved copy</Badge>
						</CardTitle>
						<small className="text-muted d-block">
							{covered} · saved {stamp(s.generatedAt)}
							{s.generatedBy ? ` by ${s.generatedBy.firstName} ${s.generatedBy.lastName}` : ''}
						</small>
						<small className="text-muted d-block"><code>{s.reference}</code></small>
					</div>
					<div className="d-flex align-items-center no-print">
						<Button tag={Link} to="/reports/snapshots" color="secondary" outline size="sm">
							<ArrowLeft size={14} /> All saved reports
						</Button>
						<Button color="secondary" outline size="sm" className="ml-1" onClick={() => window.print()}>
							<Printer size={14} /> Print
						</Button>
					</div>
				</CardHeader>

				<CardBody>
					{/* The drift answer goes first. "What did we say" without "is it still true" is
					    half an answer, and the half nobody thinks to ask for. */}
					{drift?.comparable && (
						<Alert color={drift.changed ? 'warning' : 'success'} className="p-1">
							<div className="d-flex">
								<div className="mr-1">{drift.changed ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}</div>
								<div>
									<strong>{drift.changed ? 'The records have changed since this was saved.' : 'Nothing has changed since this was saved.'}</strong>
									<div>{drift.message}</div>
									{drift.differences?.length > 0 && (
										<ul className="mb-0 mt-50">
											{drift.differences.map((d, i) => <li key={i}>{d}</li>)}
										</ul>
									)}
								</div>
							</div>
						</Alert>
					)}

					{s.note && (
						<Row className="mb-1">
							<Col>
								<small className="text-muted">Note: {s.note}</small>
							</Col>
						</Row>
					)}

					{s.reportType === 'pnl' && <FrozenPnl p={p} />}
					{s.reportType === 'departments' && <FrozenDepartments p={p} />}
					{s.reportType === 'restatement' && <FrozenRestatement p={p} />}
					{s.reportType === 'sales' && <FrozenSales p={p} />}

					<hr />
					<small className="text-muted">
						<strong>How these figures were worked out:</strong> {s.basis}
					</small>
				</CardBody>
			</Card>
		</div>
	)
}

export default SnapshotView
