import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Table, Spinner, FormGroup } from 'reactstrap'
import { getStaffCost } from '../store/action'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

const pad = (n) => String(n).padStart(2, '0')
const firstOfMonth = (offset = 0) => {
	const now = new Date()
	const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}
const monthLabel = (s) => {
	const [y, m] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, 1).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
}

const StaffCost = () => {
	const dispatch = useDispatch()
	const { staffCost, loading } = useSelector((s) => s.payroll)

	// Six months back by default: enough to see a trend, short enough to read.
	const [filters, setFilters] = useState({ startDate: firstOfMonth(-5), endDate: firstOfMonth(0) })

	useEffect(() => {
		dispatch(getStaffCost(filters))
	}, [JSON.stringify(filters)])

	const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value || undefined }))

	const rows = staffCost?.byMonthAndDepartment || []

	// Pivot to months down, departments across. Staff cost is read as "did this department get
	// more expensive", which a flat list of month-department pairs does not answer.
	const departments = [...new Set(rows.map((r) => r.departmentName || 'Unassigned'))].sort()
	const months = [...new Set(rows.map((r) => String(r.monthStart).slice(0, 10)))].sort().reverse()
	const cell = (month, department) =>
		rows.find((r) => String(r.monthStart).slice(0, 10) === month && (r.departmentName || 'Unassigned') === department)

	const columnTotal = (department) =>
		rows.filter((r) => (r.departmentName || 'Unassigned') === department).reduce((a, r) => a + Number(r.total || 0), 0)

	return (
		<div className="staff-cost">
			<Card>
				<CardHeader>
					<div>
						<CardTitle tag="h4" className="mb-25">
							Staff cost by department
						</CardTitle>
						<small className="text-muted">
							{loading ? 'Loading…' : `${naira(staffCost?.totalCost)} over ${months.length} month${months.length === 1 ? '' : 's'}`}
						</small>
					</div>
				</CardHeader>

				<CardBody>
					<Row className="mb-1">
						<Col md="3">
							<FormGroup>
								<Label>From month</Label>
								<Input type="date" value={filters.startDate || ''} onChange={set('startDate')} />
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>To month</Label>
								<Input type="date" value={filters.endDate || ''} onChange={set('endDate')} />
							</FormGroup>
						</Col>
					</Row>

					{loading ? (
						<div className="text-center py-3">
							<Spinner />
						</div>
					) : rows.length === 0 ? (
						<div className="text-center text-muted py-3">
							No approved pay runs fall in this range. Draft runs are not counted.
						</div>
					) : (
						<div style={{ overflowX: 'auto' }}>
							<Table responsive size="sm">
								<thead>
									<tr>
										<th>Month</th>
										{departments.map((d) => (
											<th key={d} className="text-right">
												{d}
											</th>
										))}
										<th className="text-right">Total</th>
									</tr>
								</thead>
								<tbody>
									{months.map((m) => {
										const monthRows = rows.filter((r) => String(r.monthStart).slice(0, 10) === m)
										const monthTotal = monthRows.reduce((a, r) => a + Number(r.total || 0), 0)
										return (
											<tr key={m}>
												<td className="text-nowrap font-weight-bold">{monthLabel(m)}</td>
												{departments.map((d) => {
													const c = cell(m, d)
													return (
														<td
															key={d}
															className="text-right text-nowrap"
															style={{ fontVariantNumeric: 'tabular-nums' }}
														>
															{c ? naira(c.total) : '—'}
															{c && (
																<div className="text-muted" style={{ fontSize: '0.7rem' }}>
																	{c.headcount} {c.headcount === 1 ? 'person' : 'people'}
																</div>
															)}
														</td>
													)
												})}
												<td className="text-right text-nowrap font-weight-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
													{naira(monthTotal)}
												</td>
											</tr>
										)
									})}
								</tbody>
								<tfoot>
									<tr>
										<th>Total</th>
										{departments.map((d) => (
											<th key={d} className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{naira(columnTotal(d))}
											</th>
										))}
										<th className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
											{naira(staffCost?.totalCost)}
										</th>
									</tr>
								</tfoot>
							</Table>
						</div>
					)}

					{/* A week straddling month end is the normal case for the smokehouse, and the
					    reason these figures will not tie to a single run's total. */}
					<small className="text-muted">
						Weeks that cross month end are counted in each month by the days worked, so a month's figure can differ from
						the pay runs that fall inside it.
					</small>
				</CardBody>
			</Card>
		</div>
	)
}

export default StaffCost
