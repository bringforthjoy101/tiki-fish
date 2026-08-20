import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
	Card, CardBody, CardHeader, CardTitle, Row, Col, Button, Table, Badge, Spinner, Alert,
	Modal, ModalHeader, ModalBody, Input, Label, FormGroup
} from 'reactstrap'
import { Edit3, PlusCircle, List } from 'react-feather'
import { getAccountBalances, getAccountMovements } from '../store/action'
import { can } from '@src/utility/capabilities'
import { OpeningBalanceModal, FundModal } from './AccountModals'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`
const signedNaira = (n) => `${Number(n) < 0 ? '−' : ''}${naira(Math.abs(Number(n) || 0))}`
const today = () => new Date().toISOString().slice(0, 10)

const readable = (s) => {
	if (!s) return '—'
	const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
	return new Date(y, m - 1, d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TYPE_LABEL = { bank: 'Bank', cash: 'Cash', pos: 'POS', mobile_money: 'Mobile money', other: 'Other' }

const MovementsModal = ({ open, toggle, account }) => {
	const dispatch = useDispatch()
	const { movements, pagination } = useSelector((s) => s.accounts)
	const [range, setRange] = useState({})
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (!open || !account) return
		setLoading(true)
		dispatch(getAccountMovements(account.id, range)).then(() => setLoading(false))
	}, [open, account, JSON.stringify(range)])

	if (!account) return null

	return (
		<Modal isOpen={open} toggle={toggle} size="lg" className="modal-dialog-centered">
			<ModalHeader toggle={toggle}>{account.name} — what moved</ModalHeader>
			<ModalBody>
				<Row className="mb-1">
					<Col md="4">
						<FormGroup>
							<Label>From</Label>
							<Input type="date" value={range.startDate || ''} onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value || undefined }))} />
						</FormGroup>
					</Col>
					<Col md="4">
						<FormGroup>
							<Label>To</Label>
							<Input type="date" max={today()} value={range.endDate || ''} onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value || undefined }))} />
						</FormGroup>
					</Col>
				</Row>

				{loading ? (
					<div className="text-center py-3"><Spinner /></div>
				) : (
					<div style={{ overflowX: 'auto', maxHeight: '55vh' }}>
						<Table responsive hover size="sm">
							<thead>
								<tr>
									<th>Date</th>
									<th>What</th>
									<th>Reference</th>
									<th className="text-right">Amount</th>
								</tr>
							</thead>
							<tbody>
								{movements.length === 0 && (
									<tr><td colSpan="4" className="text-center text-muted py-3">Nothing moved in this period.</td></tr>
								)}
								{movements.map((m) => (
									<tr key={m.id}>
										<td className="text-nowrap">{readable(m.movementDate)}</td>
										<td>{m.description || m.sourceType}</td>
										<td className="text-muted">{m.reference || ''}</td>
										<td
											className={`text-right text-nowrap font-weight-bold ${Number(m.amount) < 0 ? 'text-danger' : 'text-success'}`}
											style={{ fontVariantNumeric: 'tabular-nums' }}
										>
											{signedNaira(m.amount)}
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					</div>
				)}
				{pagination.total > movements.length && (
					<small className="text-muted">Showing {movements.length} of {pagination.total}. Narrow the dates to see the rest.</small>
				)}
			</ModalBody>
		</Modal>
	)
}

const PaymentAccounts = () => {
	const dispatch = useDispatch()
	const { accounts, cashPosition, inflowTracked, loading } = useSelector((s) => s.accounts)
	const [opening, setOpening] = useState(null)
	const [funding, setFunding] = useState(null)
	const [viewing, setViewing] = useState(null)

	useEffect(() => {
		dispatch(getAccountBalances())
	}, [])

	const unset = accounts.filter((a) => !a.openingBalanceSet)
	const canManage = can('paymentAccounts.transfer') || can('paymentAccounts.openingBalance')

	return (
		<div className="payment-accounts">
			<Card>
				<CardHeader>
					<div>
						<CardTitle tag="h4" className="mb-25">Accounts</CardTitle>
						<small className="text-muted">
							{loading ? 'Loading…' : `${accounts.length} account(s) · ${signedNaira(cashPosition)} across all of them`}
						</small>
					</div>
				</CardHeader>

				<CardBody>
					{/* The API states plainly whether money coming IN is tracked, and today it is not:
					    orders carry no payment account, so these figures are money OUT and deliberate
					    funding only. Presenting the total as the cash position would be a lie the
					    endpoint itself warns against. */}
					{!inflowTracked && !loading && (
						<Alert color="warning" className="p-1">
							<b>This is not your full cash position.</b> Money customers pay you is not yet recorded against
							an account, so these balances show what has gone <i>out</i> plus anything you have put in by hand.
							Treat them as a record of spending, not as what is in the bank.
						</Alert>
					)}

					{unset.length > 0 && !loading && (
						<Alert color="info" className="p-1">
							{unset.length} account(s) have never had an opening balance set, so their balance is only what has
							moved since the system started — not real money. Set one on each from the button in its row.
						</Alert>
					)}

					{loading ? (
						<div className="text-center py-3"><Spinner /></div>
					) : (
						<div style={{ overflowX: 'auto' }}>
							<Table responsive hover size="sm">
								<thead>
									<tr>
										<th>Account</th>
										<th>Type</th>
										<th className="text-right">Started with</th>
										<th className="text-right">Moved since</th>
										<th className="text-right">Balance</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{accounts.map((a) => (
										<tr key={a.id} className={a.isActive ? '' : 'text-muted'}>
											<td className="text-nowrap">
												<span className="font-weight-bold">{a.name}</span>
												{!a.isActive && <Badge color="light-secondary" className="ml-50">Closed</Badge>}
											</td>
											<td>{TYPE_LABEL[a.accountType] || a.accountType}</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{/* Never render an unset opening balance as ₦0 — "nobody has said" and
												    "it was empty" are different claims. */}
												{a.openingBalanceSet ? naira(a.openingBalance) : <span className="text-warning">not set</span>}
											</td>
											<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
												{signedNaira(a.movements)}
											</td>
											<td
												className={`text-right text-nowrap font-weight-bold ${Number(a.balance) < 0 ? 'text-danger' : ''}`}
												style={{ fontVariantNumeric: 'tabular-nums' }}
											>
												{signedNaira(a.balance)}
											</td>
											<td className="text-nowrap">
												<Button size="sm" color="flat-primary" onClick={() => setViewing(a)}>
													<List size={14} /> Movements
												</Button>
												{can('paymentAccounts.openingBalance') && (
													<Button size="sm" color="flat-secondary" onClick={() => setOpening(a)}>
														<Edit3 size={14} /> Opening
													</Button>
												)}
												{can('paymentAccounts.transfer') && a.isActive && (
													<Button size="sm" color="flat-secondary" onClick={() => setFunding(a)}>
														<PlusCircle size={14} /> Money in/out
													</Button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</Table>
						</div>
					)}

					{!canManage && !loading && (
						<small className="text-muted">You can see these balances but not change them.</small>
					)}
				</CardBody>
			</Card>

			<OpeningBalanceModal open={Boolean(opening)} toggle={() => setOpening(null)} account={opening} />
			<FundModal open={Boolean(funding)} toggle={() => setFunding(null)} account={funding} />
			<MovementsModal open={Boolean(viewing)} toggle={() => setViewing(null)} account={viewing} />
		</div>
	)
}

export default PaymentAccounts
