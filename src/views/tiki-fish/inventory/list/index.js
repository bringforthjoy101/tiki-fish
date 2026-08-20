import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Label, Button, Table, Badge, Spinner, FormGroup, Alert } from 'reactstrap'
import { Printer, Edit3 } from 'react-feather'
import { getStockOnHand } from '../store/action'
import { can } from '@src/utility/capabilities'
import AdjustModal from './AdjustModal'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const today = () => new Date().toISOString().slice(0, 10)

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const LEDGER_LABEL = { fish: 'Fish', packaging: 'Packaging' }

const StockOnHand = () => {
	const dispatch = useDispatch()
	const { lines, totals, asAt, showValue, loading } = useSelector((s) => s.inventory)
	const [filters, setFilters] = useState({ asAt: today() })
	const [adjusting, setAdjusting] = useState(null)

	useEffect(() => {
		dispatch(getStockOnHand(filters))
	}, [JSON.stringify(filters)])

	const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value || undefined }))

	// The count sheet is printed from the browser rather than generated server-side: it has to
	// be usable on paper by somebody walking round the cold room, and a print stylesheet is the
	// shortest path from this exact table to that.
	const printSheet = () => window.print()

	const empty = !loading && lines.length === 0

	return (
		<div className="stock-on-hand">
			<style>{`
				@media print {
					.no-print, .main-menu, .header-navbar, .footer { display: none !important; }
					.content, .app-content { margin: 0 !important; padding: 0 !important; }
					.card { box-shadow: none !important; border: none !important; }
					.count-col { width: 6rem; border-bottom: 1px solid #000 !important; }
				}
				.count-col { min-width: 5rem; }
			`}</style>

			<Card>
				<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
					<div>
						<CardTitle tag="h4" className="mb-25">Stock on hand</CardTitle>
						<small className="text-muted">
							{loading ? 'Loading…' : `${totals.lines || 0} line(s) as at ${readable(asAt)}`}
							{showValue && totals.value !== undefined ? ` · ${naira(totals.value)} at cost` : ''}
						</small>
					</div>
					<Button color="secondary" outline className="no-print" onClick={printSheet}>
						<Printer size={15} /> Print count sheet
					</Button>
				</CardHeader>

				<CardBody>
					<Row className="mb-1 no-print">
						<Col md="3">
							<FormGroup>
								<Label>As at</Label>
								<Input type="date" max={today()} value={filters.asAt || ''} onChange={set('asAt')} />
							</FormGroup>
						</Col>
						<Col md="3">
							<FormGroup>
								<Label>Ledger</Label>
								<Input type="select" value={filters.ledger || ''} onChange={set('ledger')}>
									<option value="">Fish and packaging</option>
									<option value="fish">Fish only</option>
									<option value="packaging">Packaging only</option>
								</Input>
							</FormGroup>
						</Col>
					</Row>

					{empty && (
						<Alert color="warning" className="p-1">
							Nothing to show. Fish grades and packaging items are added under <b>Reference data</b> — an item has to
							exist before there is anywhere to record what you counted.
						</Alert>
					)}

					{loading ? (
						<div className="text-center py-3"><Spinner /></div>
					) : (
						<div style={{ overflowX: 'auto' }}>
							<Table responsive hover size="sm">
								<thead>
									<tr>
										<th>Item</th>
										<th>Ledger</th>
										<th>Unit</th>
										<th className="text-right">Book quantity</th>
										{showValue && <th className="text-right">Per unit</th>}
										{showValue && <th className="text-right">Value</th>}
										{/* Blank on screen and on paper: this is the column somebody writes in. */}
										<th className="text-right count-col">Counted</th>
										{can('inventory.adjust') && <th className="no-print" />}
									</tr>
								</thead>
								<tbody>
									{lines.map((line) => (
										<tr key={`${line.ledger}-${line.speciesGradeId || ''}-${line.packagingItemId || ''}-${line.unit}`}>
											<td className="font-weight-bold text-nowrap">
												{line.name}
												{line.code ? <small className="text-muted d-block">{line.code}</small> : null}
											</td>
											<td><Badge color={line.ledger === 'fish' ? 'light-primary' : 'light-info'}>{LEDGER_LABEL[line.ledger] || line.ledger}</Badge></td>
											<td>{line.unit}</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{Number(line.quantity || 0).toLocaleString('en-NG')}
											</td>
											{showValue && (
												<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
													{line.unitCost === null || line.unitCost === undefined ? '—' : naira(line.unitCost)}
												</td>
											)}
											{showValue && (
												<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(line.value)}</td>
											)}
											<td className="count-col" />
											{can('inventory.adjust') && (
												<td className="text-nowrap no-print">
													<Button size="sm" color="flat-primary" onClick={() => setAdjusting(line)}>
														<Edit3 size={14} /> Adjust
													</Button>
												</td>
											)}
										</tr>
									))}
								</tbody>
							</Table>
						</div>
					)}
				</CardBody>
			</Card>

			<AdjustModal open={Boolean(adjusting)} toggle={() => setAdjusting(null)} line={adjusting} filters={filters} />
		</div>
	)
}

export default StockOnHand
