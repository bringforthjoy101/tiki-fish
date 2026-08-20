import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Label, Input, Button, FormGroup, Spinner, Alert } from 'reactstrap'
import { setOpeningBalance, fundAccount, getAccountBalances } from '../store/action'

const naira = (n) => `₦${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
const today = () => new Date().toISOString().slice(0, 10)

/**
 * What was already in the account.
 *
 * Deliberately separate from funding. An opening balance is a STATEMENT about money that was
 * already there before the system started watching; funding is a RECORD of money moving. They
 * look similar and mean opposite things — conflating them would either invent a deposit that
 * never happened or hide one that did.
 */
export const OpeningBalanceModal = ({ open, toggle, account }) => {
	const dispatch = useDispatch()
	const [form, setForm] = useState({ openingBalance: '', openingBalanceAt: today(), reason: '' })
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open || !account) return
		setForm({
			openingBalance: account.openingBalanceSet ? String(account.openingBalance) : '',
			openingBalanceAt: account.openingBalanceAt || today(),
			reason: '',
		})
	}, [open, account])

	if (!account) return null

	const submit = async () => {
		setSaving(true)
		const ok = await dispatch(
			setOpeningBalance(account.id, {
				openingBalance: Number(form.openingBalance),
				openingBalanceAt: form.openingBalanceAt,
				reason: form.reason || undefined,
			})
		)
		setSaving(false)
		if (ok) {
			toggle()
			dispatch(getAccountBalances())
		}
	}

	// '' is not zero. A blank box must not state that the account held nothing.
	const incomplete = String(form.openingBalance).trim() === '' || !Number.isFinite(Number(form.openingBalance)) || !form.openingBalanceAt

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered">
			<ModalHeader toggle={toggle}>What was already in {account.name}?</ModalHeader>
			<ModalBody>
				{account.openingBalanceSet && (
					<Alert color="warning" className="p-1">
						An opening balance is already set: <b>{naira(account.openingBalance)}</b> as at{' '}
						{account.openingBalanceAt}. Changing it moves this account's balance and every total it is
						part of. Only do this if the original figure was wrong.
					</Alert>
				)}
				{!account.openingBalanceSet && (
					<Alert color="info" className="p-1">
						Nobody has said what was in this account when the system started, so its balance today is only
						the money that has moved since. Stating it here makes the balance real.
					</Alert>
				)}

				<Row>
					<Col md="7">
						<FormGroup>
							<Label for="openingBalance">Amount in the account *</Label>
							<Input
								id="openingBalance"
								type="number"
								step="0.01"
								value={form.openingBalance}
								onChange={(e) => setForm((f) => ({ ...f, openingBalance: e.target.value }))}
							/>
							<small className="text-muted">What the bank statement or the cash box actually said.</small>
						</FormGroup>
					</Col>
					<Col md="5">
						<FormGroup>
							<Label for="openingBalanceAt">As at *</Label>
							<Input
								id="openingBalanceAt"
								type="date"
								max={today()}
								value={form.openingBalanceAt}
								onChange={(e) => setForm((f) => ({ ...f, openingBalanceAt: e.target.value }))}
							/>
						</FormGroup>
					</Col>
				</Row>
				<FormGroup>
					<Label for="reason">Why / where this figure came from</Label>
					<Input
						id="reason"
						type="text"
						placeholder="e.g. Bank statement 31 Jul 2026"
						value={form.reason}
						onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
					/>
					<small className="text-muted">Kept in the audit trail, so the figure can be explained later.</small>
				</FormGroup>
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>Cancel</Button>
				<Button color="primary" onClick={submit} disabled={saving || incomplete}>
					{saving ? <Spinner size="sm" /> : 'Set it'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}

/**
 * Money in or out that is not a purchase or a payment.
 *
 * The endpoint takes a SIGNED amount, where negative means money leaving. Asking somebody to
 * type a minus sign is how a withdrawal gets recorded as a deposit, so the form asks for a
 * direction and a positive number and applies the sign itself.
 */
export const FundModal = ({ open, toggle, account }) => {
	const dispatch = useDispatch()
	const [form, setForm] = useState({ direction: 'in', amount: '', movementDate: today(), description: '', reference: '' })
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (open) setForm({ direction: 'in', amount: '', movementDate: today(), description: '', reference: '' })
	}, [open])

	if (!account) return null

	const amount = Number(form.amount) || 0
	const signed = form.direction === 'out' ? -amount : amount
	const after = Math.round((Number(account.balance || 0) + signed) * 100) / 100

	const submit = async () => {
		setSaving(true)
		const ok = await dispatch(
			fundAccount(account.id, {
				amount: signed,
				movementDate: form.movementDate,
				description: form.description || undefined,
				reference: form.reference || undefined,
			})
		)
		setSaving(false)
		if (ok) {
			toggle()
			dispatch(getAccountBalances())
		}
	}

	const incomplete = !(amount > 0) || !form.movementDate

	return (
		<Modal isOpen={open} toggle={toggle} className="modal-dialog-centered">
			<ModalHeader toggle={toggle}>Money in or out of {account.name}</ModalHeader>
			<ModalBody>
				<Alert color="info" className="p-1">
					This is for money that is not a purchase or a supplier payment — putting cash into the bank,
					taking float out for the market, moving between your own accounts. Spending goes through
					<b> Expenses</b> so it reaches the accounts as well as the ledger.
				</Alert>

				<Row>
					<Col md="5">
						<FormGroup>
							<Label for="direction">Direction *</Label>
							<Input
								type="select"
								id="direction"
								value={form.direction}
								onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}
							>
								<option value="in">Money in</option>
								<option value="out">Money out</option>
							</Input>
						</FormGroup>
					</Col>
					<Col md="7">
						<FormGroup>
							<Label for="amount">Amount *</Label>
							<Input
								id="amount"
								type="number"
								step="0.01"
								min="0"
								value={form.amount}
								onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
							/>
						</FormGroup>
					</Col>
				</Row>

				<Row>
					<Col md="5">
						<FormGroup>
							<Label for="movementDate">Dated *</Label>
							<Input
								id="movementDate"
								type="date"
								max={today()}
								value={form.movementDate}
								onChange={(e) => setForm((f) => ({ ...f, movementDate: e.target.value }))}
							/>
						</FormGroup>
					</Col>
					<Col md="7">
						<FormGroup>
							<Label for="reference">Reference</Label>
							<Input
								id="reference"
								type="text"
								placeholder="Teller number, transfer ref"
								value={form.reference}
								onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
							/>
						</FormGroup>
					</Col>
				</Row>

				<FormGroup>
					<Label for="description">What is this?</Label>
					<Input
						id="description"
						type="text"
						placeholder="e.g. Cash banked from Saturday sales"
						value={form.description}
						onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
					/>
				</FormGroup>

				{amount > 0 && (
					<div className="border rounded p-1">
						<div className="text-muted" style={{ fontSize: '0.75rem' }}>{account.name} will read</div>
						<div className={`font-weight-bold ${after < 0 ? 'text-danger' : ''}`}>{naira(after)}</div>
						{after < 0 && <small className="text-danger">That would take the account below zero.</small>}
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<Button color="secondary" outline onClick={toggle} disabled={saving}>Cancel</Button>
				<Button color="primary" onClick={submit} disabled={saving || incomplete}>
					{saving ? <Spinner size="sm" /> : 'Record it'}
				</Button>
			</ModalFooter>
		</Modal>
	)
}
