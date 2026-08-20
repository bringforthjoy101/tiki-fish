import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, Link } from 'react-router-dom'
import { Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Button, Table, Badge, Spinner, Alert } from 'reactstrap'
import { Printer, Check } from 'react-feather'
import { getStockCount, populateStockCount, saveCountLine, postStockCount } from '../store/action'
import { can } from '@src/utility/capabilities'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const EPSILON = 0.0005

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS = {
	draft: { label: 'Draft', color: 'light-secondary' },
	posted: { label: 'Posted', color: 'light-success' },
	cancelled: { label: 'Cancelled', color: 'light-danger' },
}

const LEDGER_LABEL = { fish: 'Fish', packaging: 'Packaging', product: 'Finished goods' }

/**
 * One row of the sheet.
 *
 * Kept as its own component with its own local state so that typing into 130 rows does not
 * re-render the whole table on every keystroke. The row saves on blur rather than on change —
 * a count is typed from paper and a request per digit would be both slow and wrong.
 */
const CountRow = ({ line, countId, editable, onSaved }) => {
	const dispatch = useDispatch()
	const [counted, setCounted] = useState(line.countedQuantity ?? '')
	const [unitCost, setUnitCost] = useState(line.unitCost ?? '')
	const [saving, setSaving] = useState(false)
	const [dirty, setDirty] = useState(false)

	useEffect(() => {
		setCounted(line.countedQuantity ?? '')
		setUnitCost(line.unitCost ?? '')
		setDirty(false)
	}, [line.id, line.countedQuantity, line.unitCost])

	const variance = counted === '' ? 0 : Math.round((Number(counted) - Number(line.bookQuantity || 0)) * 1000) / 1000
	const isSurplus = variance > EPSILON
	// Number('') and Number(null) are both 0, so a `>= 0` test treats an untouched box as a
	// stated cost of nothing — and a surplus valued at nothing silently re-prices every unit of
	// that item. Blank means absent; a real cost must be positive.
	const hasCost = String(unitCost).trim() !== '' && Number(unitCost) > 0
	const needsCost = isSurplus && !hasCost

	const save = async () => {
		if (!dirty) return

		// A cleared box is not a count of zero. Saving it would mark the line as keyed and let

		// the sheet post, writing off stock nobody looked at. Leave it uncounted.

		if (String(counted).trim() === '') return
		setSaving(true)
		const result = await dispatch(
			saveCountLine(countId, line.id, {
				countedQuantity: Number(counted),
				...(isSurplus && hasCost ? { unitCost: Number(unitCost) } : {}),
			})
		)
		setSaving(false)
		if (result) {
			setDirty(false)
			onSaved(line.id, result)
		}
	}

	let varianceClass = 'text-muted'
	if (variance > EPSILON) varianceClass = 'text-success font-weight-bold'
	if (variance < -EPSILON) varianceClass = 'text-danger font-weight-bold'

	return (
		<tr>
			<td className="text-nowrap">
				<span className="font-weight-bold">{line.name}</span>
				<small className="text-muted d-block">{LEDGER_LABEL[line.ledger] || line.ledger}</small>
			</td>
			<td>{line.unit}</td>
			<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
				{Number(line.bookQuantity || 0).toLocaleString('en-NG')}
			</td>
			<td style={{ minWidth: '7rem' }}>
				{editable ? (
					<Input
						type="number"
						step="0.001"
						min="0"
						bsSize="sm"
						value={counted}
						onChange={(e) => { setCounted(e.target.value); setDirty(true) }}
						onBlur={save}
						disabled={saving}
					/>
				) : (
					<span style={{ fontVariantNumeric: 'tabular-nums' }}>{Number(line.countedQuantity || 0).toLocaleString('en-NG')}</span>
				)}
			</td>
			<td className={`text-right text-nowrap ${varianceClass}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
				{counted === '' ? '—' : `${variance > 0 ? '+' : ''}${variance.toLocaleString('en-NG')}`}
			</td>
			<td style={{ minWidth: '8rem' }}>
				{/* Only asked for on a surplus. Found stock has no history to average against, so
				    somebody states what it is worth; a shortfall is priced at the book's own cost. */}
				{editable && isSurplus ? (
					<Input
						type="number"
						step="0.01"
						min="0"
						bsSize="sm"
						placeholder="cost per unit"
						invalid={needsCost}
						value={unitCost}
						onChange={(e) => { setUnitCost(e.target.value); setDirty(true) }}
						onBlur={save}
						disabled={saving}
					/>
				) : (
					<span className="text-muted">{line.unitCost ? naira(line.unitCost) : ''}</span>
				)}
			</td>
			<td className="text-center" style={{ width: '2.5rem' }}>
				{saving && <Spinner size="sm" />}
				{!saving && !dirty && counted !== '' && <Check size={15} className="text-success" />}
			</td>
		</tr>
	)
}

const StockCountView = () => {
	const { id } = useParams()
	const dispatch = useDispatch()
	const { count, lines, totals, loading } = useSelector((s) => s.stockCount)
	const [posting, setPosting] = useState(false)
	const [local, setLocal] = useState({})

	useEffect(() => {
		dispatch(getStockCount(id))
	}, [id])

	// Merge the server's response for a saved row over the loaded list, so the book quantity a
	// row shows is the one the server re-snapshotted rather than the one loaded minutes ago.
	const merged = lines.map((l) => (local[l.id] ? { ...l, ...local[l.id] } : l))
	const onSaved = (lineId, result) => setLocal((s) => ({ ...s, [lineId]: result }))

	const editable = count?.status === 'draft' && can('stockCounts.manage')
	// countedQuantity is NULL until somebody keys it, and the server refuses to post while any
	// line is still NULL. Surfacing that here means the operator sees what is outstanding rather
	// than discovering it when Post is rejected.
	const unkeyed = merged.filter((l) => l.countedQuantity === null || l.countedQuantity === undefined)
	const withVariance = merged.filter(
		(l) => l.countedQuantity !== null && l.countedQuantity !== undefined && Math.abs(Number(l.countedQuantity) - Number(l.bookQuantity || 0)) > EPSILON
	)
	const unpriced = withVariance.filter((l) => Number(l.countedQuantity || 0) - Number(l.bookQuantity || 0) > EPSILON && !(Number(l.unitCost) > 0))

	const build = async () => {
		const ok = await dispatch(populateStockCount(id))
		if (ok) dispatch(getStockCount(id))
	}

	const post = async () => {
		setPosting(true)
		const ok = await dispatch(postStockCount(id))
		setPosting(false)
		if (ok) dispatch(getStockCount(id))
	}

	if (loading && !count) return <div className="text-center py-3"><Spinner /></div>
	if (!count) return <Alert color="danger" className="p-1">Count not found.</Alert>

	return (
		<div className="stock-count-view">
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
						<CardTitle tag="h4" className="mb-25">
							{count.reference} <Badge color={STATUS[count.status]?.color}>{STATUS[count.status]?.label}</Badge>
						</CardTitle>
						<small className="text-muted">
							Counted {readable(count.countDate)} · {totals.lines || 0} line(s) · {totals.notCounted || 0} not counted · {totals.withVariance || 0} differ · {totals.agreed || 0} agreed
						</small>
					</div>
					<div className="no-print">
						<Button color="secondary" outline className="mr-1" onClick={() => window.print()}>
							<Printer size={15} /> Print
						</Button>
						{merged.length > 0 && (
							<Link to={`/stock-counts/variance/${id}`}>
								<Button color="info" outline className="mr-1">What it found</Button>
							</Link>
						)}
						{editable && merged.length === 0 && (
							<Button color="primary" className="mr-1" onClick={build}>Build the sheet</Button>
						)}
						{count.status === 'draft' && can('stockCounts.post') && merged.length > 0 && (
							<Button color="success" onClick={post} disabled={posting || unpriced.length > 0 || unkeyed.length > 0}>
								{posting ? <Spinner size="sm" /> : 'Post the count'}
							</Button>
						)}
					</div>
				</CardHeader>

				<CardBody>
					{merged.length === 0 && (
						<Alert color="info" className="p-1">
							This sheet is empty. <b>Build the sheet</b> fills it with every fish grade, packaging item and
							product at its current book quantity — including the ones holding nothing, because an item that
							only appears once it has stock can never be found missing.
						</Alert>
					)}

					{unkeyed.length > 0 && (
						<Alert color="info" className="p-1 no-print">
							{unkeyed.length} of {merged.length} line(s) have not been counted yet. Enter a figure for every
							line before posting — <b>zero is a valid count</b>, and it is the most useful one there is.
						</Alert>
					)}

					{unpriced.length > 0 && (
						<Alert color="warning" className="p-1 no-print">
							{unpriced.length} line(s) found MORE than the book says and need a cost per unit before this can be
							posted. Stock added without a cost would leave the ledger holding quantity with no value, and the
							cost of everything already there would come out wrong.
						</Alert>
					)}

					{count.status === 'posted' && (
						<Alert color="success" className="p-1">
							Posted. Every difference below is in the ledger, dated {readable(count.countDate)}.
						</Alert>
					)}

					{merged.length > 0 && (
						<div style={{ overflowX: 'auto' }}>
							<Table responsive hover size="sm">
								<thead>
									<tr>
										<th>Item</th>
										<th>Unit</th>
										<th className="text-right">Book</th>
										<th>Counted</th>
										<th className="text-right">Difference</th>
										<th>Cost per unit</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{merged.map((line) => (
										<CountRow key={line.id} line={line} countId={id} editable={editable} onSaved={onSaved} />
									))}
								</tbody>
							</Table>
						</div>
					)}
				</CardBody>
			</Card>

			<div className="no-print">
				<Link to="/stock-counts/list">← All counts</Link>
			</div>
		</div>
	)
}

export default StockCountView
