import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, Input, Button, FormGroup, Spinner, ButtonGroup } from 'reactstrap'
import { createPayRun } from '../store/action'

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (s) => {
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d)
}

// The Monday rule lives in a DB CHECK and is re-stated by the API. This snaps the picker so
// nobody meets that refusal by accident; it is an affordance, not the enforcement.
const mondayOf = (date) => {
	const d = parse(date)
	const shift = d.getDay() === 0 ? 6 : d.getDay() - 1
	d.setDate(d.getDate() - shift)
	return ymd(d)
}
const addDays = (date, n) => {
	const d = parse(date)
	d.setDate(d.getDate() + n)
	return ymd(d)
}
const monthBounds = (offset = 0) => {
	const now = new Date()
	const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
	const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
	return { periodStart: ymd(start), periodEnd: ymd(end) }
}

const readable = (s) =>
	parse(s).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

const NewRunModal = ({ open, toggle }) => {
	const dispatch = useDispatch()
	const history = useHistory()
	const [payType, setPayType] = useState('weekly_variable')
	const [weekStart, setWeekStart] = useState(mondayOf(ymd(new Date())))
	const [month, setMonth] = useState(monthBounds(0))
	const [notes, setNotes] = useState('')
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) return
		setPayType('weekly_variable')
		setWeekStart(mondayOf(ymd(new Date())))
		setMonth(monthBounds(0))
		setNotes('')
	}, [open])

	const weekly = payType === 'weekly_variable'
	const periodStart = weekly ? weekStart : month.periodStart
	const periodEnd = weekly ? addDays(weekStart, 6) : month.periodEnd

	// Straddling weeks are the normal case at month end, and the split is the thing people
	// most need reassuring about. Saying it up front beats explaining it after approval.
	const straddles = parse(periodStart).getMonth() !== parse(periodEnd).getMonth()

	const PREFILL_NOTE = {
		weekly_variable: 'Everyone paid weekly and active in this period is pre-filled with their usual rate. You set the real amounts before approving.',
		monthly_fixed: 'Everyone salaried and active in this period is pre-filled with their monthly salary.',
	}
	const prefillNote = PREFILL_NOTE[payType]

	const submit = async () => {
		setSaving(true)
		const run = await dispatch(createPayRun({ payType, periodStart, periodEnd, notes: notes || null }))
		setSaving(false)
		if (run) {
			toggle()
			history.push(`/payroll/runs/view/${run.id}`)
		}
	}

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered">
			<ModalHeader toggle={toggle}>Open a pay run</ModalHeader>
			<ModalBody>
				<FormGroup>
					<Label>Which payroll?</Label>
					<div>
						<ButtonGroup>
							<Button color="primary" outline={!weekly} onClick={() => setPayType('weekly_variable')}>
								Weekly — smokehouse
							</Button>
							<Button color="primary" outline={weekly} onClick={() => setPayType('monthly_fixed')}>
								Monthly — salaried
							</Button>
						</ButtonGroup>
					</div>
				</FormGroup>

				{weekly && (
					<FormGroup>
						<Label for="weekStart">Week beginning</Label>
						<Input
							id="weekStart"
							type="date"
							value={weekStart}
							onChange={(e) => e.target.value && setWeekStart(mondayOf(e.target.value))}
						/>
						<div className="d-flex mt-50">
							<Button size="sm" color="flat-primary" onClick={() => setWeekStart(mondayOf(ymd(new Date())))}>
								This week
							</Button>
							<Button size="sm" color="flat-primary" onClick={() => setWeekStart(addDays(mondayOf(ymd(new Date())), -7))}>
								Last week
							</Button>
						</div>
						<small className="text-muted">Pay weeks run Monday to Sunday — any date you pick snaps back to its Monday.</small>
					</FormGroup>
				)}
				{!weekly && (
					<Row>
						<Col md="6">
							<FormGroup>
								<Label for="periodStart">From</Label>
								<Input id="periodStart" type="date" value={month.periodStart} onChange={(e) => setMonth((m) => ({ ...m, periodStart: e.target.value }))} />
							</FormGroup>
						</Col>
						<Col md="6">
							<FormGroup>
								<Label for="periodEnd">To</Label>
								<Input id="periodEnd" type="date" value={month.periodEnd} onChange={(e) => setMonth((m) => ({ ...m, periodEnd: e.target.value }))} />
							</FormGroup>
						</Col>
						<Col md="12" className="mb-1">
							<Button size="sm" color="flat-primary" onClick={() => setMonth(monthBounds(0))}>
								This month
							</Button>
							<Button size="sm" color="flat-primary" onClick={() => setMonth(monthBounds(-1))}>
								Last month
							</Button>
						</Col>
					</Row>
				)}

				<div className="border rounded p-1 mb-1">
					<div className="font-weight-bold">
						{readable(periodStart)} → {readable(periodEnd)}
					</div>
					<small className="text-muted">{prefillNote}</small>
					{straddles && (
						<div className="text-warning mt-50" style={{ fontSize: '0.8rem' }}>
							This period crosses month end — each amount will be split between the two months by days worked.
						</div>
					)}
				</div>

				<FormGroup>
					<Label for="notes">Notes</Label>
					<Input id="notes" type="textarea" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} />
				</FormGroup>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>
					Cancel
				</Button>
				<Button color="primary" onClick={submit} disabled={saving || !periodStart || !periodEnd}>
					{saving ? <Spinner size="sm" /> : 'Open draft'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

export default NewRunModal
