import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Spinner, Alert, FormGroup, Badge } from 'reactstrap'
import { Printer } from 'react-feather'
import { getDepartments } from '../store/action'
import SaveSnapshot from '../SaveSnapshot'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const signed = (n) => `${Number(n) < 0 ? '−' : ''}${naira(Math.abs(Number(n) || 0))}`

const monthStart = () => {
	const d = new Date()
	return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
const today = () => new Date().toISOString().slice(0, 10)

const Departments = () => {
	const dispatch = useDispatch()
	const { departments: data, loading } = useSelector((s) => s.reports)
	const [range, setRange] = useState({ startDate: monthStart(), endDate: today() })

	useEffect(() => {
		dispatch(getDepartments(range))
	}, [JSON.stringify(range)])

	const set = (field) => (e) => setRange((r) => ({ ...r, [field]: e.target.value || undefined }))

	if (loading && !data) return <div className="text-center py-3"><Spinner /></div>

	const comparable = (data?.departments || []).filter((d) => d.comparable)
	const notComparable = (data?.departments || []).filter((d) => !d.comparable)

	return (
		<div className="departments-report">
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
						<CardTitle tag="h4" className="mb-25">How each part of the business did</CardTitle>
						<small className="text-muted">
							What each department earned back through sales, against what it actually spent
						</small>
					</div>
					<div className="d-flex align-items-center">
						<SaveSnapshot reportType="departments" range={range} />
						<Button color="secondary" outline className="no-print ml-1" onClick={() => window.print()}>
							<Printer size={15} /> Print
						</Button>
					</div>
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

					{data?.coverage?.message && (
						<Alert color={data.coverage.isComplete ? 'info' : 'warning'} className="p-1">
							{data.coverage.message}
						</Alert>
					)}

					<Alert color="light" className="p-1 border">
						<b>How to read this.</b> Every product sold carries a cost worked out at the time — so much for
						the fish, so much for smoking it, so much for packaging, so much for delivery. That is what a
						department <i>recovered</i>. Against it sits what the department actually spent. A department
						recovering more than it spends is carrying its weight.
					</Alert>

					{/* The comparable rows, and only these get a total. */}
					<h5 className="mt-2">Where the comparison holds</h5>
					<div style={{ overflowX: 'auto' }}>
						<Table responsive hover size="sm">
							<thead>
								<tr>
									<th>Department</th>
									<th className="text-right">Recovered</th>
									<th className="text-right">Spent</th>
									<th className="text-right">Result</th>
								</tr>
							</thead>
							<tbody>
								{comparable.map((d) => (
									<tr key={d.departmentId}>
										<td>
											<span className="font-weight-bold">{d.name}</span>
											{d.note && <small className="text-muted d-block">{d.note}</small>}
										</td>
										<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(d.recovery)}</td>
										<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
											{naira(d.actual)}<small className="text-muted d-block">{d.entries} entries</small>
										</td>
										<td
											className={`text-right text-nowrap font-weight-bold ${Number(d.result) < 0 ? 'text-danger' : 'text-success'}`}
											style={{ fontVariantNumeric: 'tabular-nums' }}
										>
											{signed(d.result)}
										</td>
									</tr>
								))}
								{data?.comparableTotal && (
									<tr className="font-weight-bold">
										<td>Together</td>
										<td className="text-right text-nowrap">{naira(data.comparableTotal.recovery)}</td>
										<td className="text-right text-nowrap">{naira(data.comparableTotal.actual)}</td>
										<td className={`text-right text-nowrap ${data.comparableTotal.result < 0 ? 'text-danger' : 'text-success'}`}>
											{signed(data.comparableTotal.result)}
										</td>
									</tr>
								)}
							</tbody>
						</Table>
					</div>

					{/* Shown, not hidden — the money is real. But never totalled with the above. */}
					{notComparable.length > 0 && (
						<>
							<h5 className="mt-2">Where it does not</h5>
							<p className="text-muted mb-1">
								These are shown because the money is real, but the two sides are not measuring the same thing,
								so the result column below is <b>not</b> a profit and is deliberately left out of the total above.
							</p>
							{notComparable.map((d) => (
								<div key={d.departmentId} className="border rounded p-1 mb-1">
									<Row>
										<Col md="7">
											<span className="font-weight-bold">{d.name}</span>
											<Badge color="light-warning" className="ml-50">not a real result</Badge>
											<div className="text-muted mt-25" style={{ fontSize: '0.85rem' }}>{d.caveat}</div>
										</Col>
										<Col md="5">
											<Table size="sm" className="mb-0">
												<tbody>
													<tr><td className="text-muted">Recovered</td><td className="text-right text-nowrap">{naira(d.recovery)}</td></tr>
													<tr><td className="text-muted">Spent (counted)</td><td className="text-right text-nowrap">{naira(d.actual)}</td></tr>
													{d.excludedFromActual > 0 && (
														<tr>
															<td className="text-muted">Spent (not counted)</td>
															<td className="text-right text-nowrap text-warning">{naira(d.excludedFromActual)}</td>
														</tr>
													)}
												</tbody>
											</Table>
										</Col>
									</Row>
								</div>
							))}
						</>
					)}

					{data?.notes?.excludedFromSpend && (
						<small className="text-muted d-block mt-1">{data.notes.excludedFromSpend}</small>
					)}
					{data?.notes?.smokeHouseUnderstated && (
						<small className="text-muted d-block">{data.notes.smokeHouseUnderstated}</small>
					)}
				</CardBody>
			</Card>
		</div>
	)
}

export default Departments
