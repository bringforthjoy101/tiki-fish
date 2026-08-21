import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Table, Spinner, Alert, Badge, Button, Input, FormGroup, Label, Row, Col } from 'reactstrap'
import { Link } from 'react-router-dom'
import { getSnapshots } from '../store/action'

const TYPE_LABEL = {
	pnl: 'Profit and loss',
	departments: 'By department',
	restatement: 'What changed, and why',
}

const readable = (s) => {
	if (!s) return null
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const stamp = (s) => (s ? new Date(s).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

const period = (row) => {
	if (!row.periodStart && !row.periodEnd) return 'All time'
	return `${readable(row.periodStart) || 'the start'} to ${readable(row.periodEnd) || 'today'}`
}

const SnapshotList = () => {
	const dispatch = useDispatch()
	const { snapshots, loading } = useSelector((s) => s.reports)
	const [type, setType] = useState('')

	useEffect(() => {
		dispatch(getSnapshots(type ? { reportType: type } : {}))
	}, [type])

	return (
		<Card>
			<CardHeader>
				<div>
					<CardTitle tag="h4" className="mb-25">Saved reports</CardTitle>
					<small className="text-muted">
						Permanent copies of what a report said on the day it was produced. Orders and expenses can still be edited afterwards, so a
						report re-run next month may not match one of these. Open any copy to see whether anything underneath it has moved.
					</small>
				</div>
			</CardHeader>
			<CardBody>
				<Row className="mb-1">
					<Col md="4" sm="12">
						<FormGroup className="mb-0">
							<Label>Show</Label>
							<Input type="select" value={type} onChange={(e) => setType(e.target.value)}>
								<option value="">Every saved report</option>
								<option value="pnl">Profit and loss</option>
								<option value="departments">By department</option>
								<option value="restatement">What changed, and why</option>
							</Input>
						</FormGroup>
					</Col>
				</Row>

				{loading && <div className="text-center py-3"><Spinner /></div>}

				{!loading && !snapshots?.length && (
					<Alert color="primary" className="p-1 mb-0">
						No reports have been saved yet. Open a report, choose the dates you want, then use <strong>Save this report</strong>.
					</Alert>
				)}

				{!loading && snapshots?.length > 0 && (
					<Table responsive hover size="sm">
						<thead>
							<tr>
								<th>Reference</th>
								<th>Report</th>
								<th>Period covered</th>
								<th>Saved</th>
								<th>Saved by</th>
								<th>Note</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{snapshots.map((row) => (
								<tr key={row.id}>
									<td className="text-nowrap"><code>{row.reference}</code></td>
									<td><Badge color="light-primary">{TYPE_LABEL[row.reportType] || row.reportType}</Badge></td>
									<td className="text-nowrap">{period(row)}</td>
									<td className="text-nowrap">{stamp(row.generatedAt)}</td>
									<td className="text-nowrap">
										{row.generatedBy ? `${row.generatedBy.firstName} ${row.generatedBy.lastName}` : '—'}
									</td>
									<td><small className="text-muted">{row.note || ''}</small></td>
									<td className="text-right">
										<Button tag={Link} to={`/reports/snapshots/${row.id}`} color="primary" outline size="sm">
											Open
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				)}
			</CardBody>
		</Card>
	)
}

export default SnapshotList
