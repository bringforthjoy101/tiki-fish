import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Table, Badge, Spinner, Alert, Button } from 'reactstrap'
import { Printer } from 'react-feather'
import { apiRequest, swal } from '@utils'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const signedNaira = (n) => `${Number(n) < 0 ? '−' : ''}${naira(Math.abs(Number(n) || 0))}`

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const LEDGER_LABEL = { fish: 'Fish', packaging: 'Packaging', product: 'Finished goods' }

const StockCountVariance = () => {
	const { id } = useParams()
	const dispatch = useDispatch()
	const [data, setData] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			setLoading(true)
			const response = await apiRequest({ url: `/stock-counts/${id}/variance`, method: 'GET' }, dispatch)
			if (response?.data?.status) setData(response.data.data)
			else swal('Oops!', response?.data?.message || 'Could not load the variance.', 'error')
			setLoading(false)
		}
		load()
	}, [id])

	if (loading) return <div className="text-center py-3"><Spinner /></div>
	if (!data) return <Alert color="danger" className="p-1">Nothing to show.</Alert>

	const { count, totals, byLedger, rows, showValue, valuesAreFinal } = data

	return (
		<div className="stock-count-variance">
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
						<CardTitle tag="h4" className="mb-25">What the count found — {count.reference}</CardTitle>
						<small className="text-muted">
							Counted {readable(count.countDate)} · {totals.linesWithVariance} line(s) differ · {totals.short} short · {totals.over} over
							{showValue && totals.value !== undefined && totals.linesWithVariance > totals.linesWithoutValue ? ` · ${signedNaira(totals.value)} net` : ''}
						</small>
					</div>
					<Button color="secondary" outline className="no-print" onClick={() => window.print()}>
						<Printer size={15} /> Print
					</Button>
				</CardHeader>

				<CardBody>
					{/* A draft's quantities are real but its money is not: nothing has posted, so there
					    is no unit cost to value a difference at. Saying so beats printing a number that
					    changes when the count is committed. */}
					{!valuesAreFinal && (
						<Alert color="warning" className="p-1">
							This count is still a <b>draft</b>. The quantities below are what the sheet says, but the money is
							not final until it is posted — a difference has no value until it has been priced and written.
						</Alert>
					)}

					{/* Deliberately NOT no-print. The printed sheet is the artefact the owner acts on,
					    and a partial net with the caveat stripped off is worse than no net at all. */}
					{showValue && totals.linesWithoutValue > 0 && (
						<Alert color="info" className="p-1">
							{totals.linesWithoutValue} of {totals.linesWithVariance} line(s) could not be valued, so the net figure
							below covers only part of the sheet.
						</Alert>
					)}

					{rows.length === 0 && (
						<Alert color="success" className="p-1">
							Every line counted agreed with the book. Nothing to explain.
						</Alert>
					)}

					{Object.keys(byLedger).length > 0 && (
						<Row className="mb-1">
							{Object.entries(byLedger).map(([ledger, b]) => (
								<Col md="4" key={ledger}>
									<div className="border rounded p-1">
										<div className="text-muted" style={{ fontSize: '0.75rem' }}>{LEDGER_LABEL[ledger] || ledger}</div>
										<div className="font-weight-bold">
											{/* b.valued is 0 when nothing in this bucket could be priced. Printing ₦0
											    there would assert the shrinkage cost nothing, which is a different
											    claim from not knowing. */}
											{!showValue && `${b.lines} line(s)`}
											{showValue && (b.valued ? signedNaira(b.value) : '—')}
										</div>
										<small className="text-muted">{b.short} short · {b.over} over</small>
									</div>
								</Col>
							))}
						</Row>
					)}

					{rows.length > 0 && (
						<div style={{ overflowX: 'auto' }}>
							<Table responsive hover size="sm">
								<thead>
									<tr>
										<th>Item</th>
										<th>Unit</th>
										<th className="text-right">Book</th>
										<th className="text-right">Counted</th>
										<th className="text-right">Difference</th>
										<th className="text-right">%</th>
										{showValue && <th className="text-right">Worth</th>}
										<th>Note</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((r, i) => (
										<tr key={`${r.ledger}-${r.name}-${r.unit}-${i}`}>
											<td className="text-nowrap">
												<span className="font-weight-bold">{r.name}</span>
												<small className="text-muted d-block">{LEDGER_LABEL[r.ledger] || r.ledger}</small>
											</td>
											<td>{r.unit}</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{r.bookQuantity.toLocaleString('en-NG')}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{r.countedQuantity.toLocaleString('en-NG')}
											</td>
											<td
												className={`text-right text-nowrap font-weight-bold ${r.variance < 0 ? 'text-danger' : 'text-success'}`}
												style={{ fontVariantNumeric: 'tabular-nums' }}
											>
												{r.variance > 0 ? '+' : ''}{r.variance.toLocaleString('en-NG')}
											</td>
											<td className="text-right text-nowrap text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{/* No percentage against a book of zero: finding stock where the book
												    said none is a discovery, not a rate. */}
												{r.variancePct === null ? '—' : `${r.variancePct > 0 ? '+' : ''}${r.variancePct}%`}
											</td>
											{showValue && (
												<td
													className={`text-right text-nowrap ${Number(r.varianceValue) < 0 ? 'text-danger' : ''}`}
													style={{ fontVariantNumeric: 'tabular-nums' }}
												>
													{r.varianceValue === null || r.varianceValue === undefined ? '—' : signedNaira(r.varianceValue)}
												</td>
											)}
											<td className="text-muted">{r.note || ''}</td>
										</tr>
									))}
								</tbody>
							</Table>
						</div>
					)}
				</CardBody>
			</Card>

			<div className="no-print">
				<Link to={`/stock-counts/view/${id}`}>← Back to the sheet</Link>
			</div>
		</div>
	)
}

export default StockCountVariance
