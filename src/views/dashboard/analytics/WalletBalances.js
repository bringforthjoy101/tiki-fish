import { Card, CardBody, CardHeader, CardTitle, Row, Col, Alert, Badge } from 'reactstrap'
import { AlertTriangle, Anchor, Truck, Package, Thermometer, TrendingUp, Zap } from 'react-feather'

/**
 * The six wallet balances.
 *
 * WHAT THESE NUMBERS ARE, AND WHY THE LABELS MATTER
 *
 * They are not cash. Cash lives on the payment accounts (Main Bank, Cash on Hand, Petty
 * Cash, POS, Mobile Money) and the two are not expected to match. These are cost-recovery
 * envelopes: every sale splits into five buckets, each bucket is credited with what that
 * sale recovered, and spending in that category is debited back out.
 *
 * The wallet named SALES in the database is the FISH COST envelope - the money set aside to
 * replace the fish that was sold - which is the single most misread thing in this schema. It
 * is labelled "Fish cost" here for that reason; a card reading "Sales ₦384m" next to a
 * revenue figure would be read as a second, disagreeing revenue number.
 *
 * WHY AN EARLIER VERSION OF THIS WAS DELETED
 *
 * Six tiles used to render these balances on this page. They were removed in Phase 3 because
 * the figures had stopped moving on 2 April 2026 and SALES was overstated by roughly 57% from
 * double-booked history - and the page showed them with no indication of either problem. So
 * this component renders the ledger-health figures alongside the balances rather than beside
 * them in a log somewhere: if the numbers stop being trustworthy, the card says so.
 *
 * OVERHEAD is always negative, by design. No part of a sale is allocated to overhead - there
 * is no recovery envelope for salaries or electricity - so it only ever goes down. That is
 * the honest reading, and it is why these columns had to be made signed (migration 035):
 * while they were UNSIGNED an overdrawn wallet displayed as exactly ₦0.
 */

const ICONS = {
	SALES: Anchor,
	LOGISTICS: Truck,
	PACKAGING: Package,
	SMOKE_HOUSE: Thermometer,
	PROFIT: TrendingUp,
	OVERHEAD: Zap,
}

const naira = (value) =>
	Number(value || 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })

const WalletBalances = ({ wallets }) => {
	// Absent means the viewer is not an owner, or the dashboard has not loaded. Either way
	// there is nothing honest to draw, and six placeholder zeros would read as real balances.
	if (!wallets) return null

	const { resetAt, resetNote, retained, schemaReady, health } = wallets

	// Before migration 035 the OVERHEAD wallet does not exist. Saying so beats rendering it as
	// ₦0, which is indistinguishable from an overhead bill of nothing.
	if (!schemaReady) {
		const missing = (wallets.wallets || []).filter((w) => !w.exists).map((w) => w.label)
		return (
			<Card>
				<CardHeader>
					<CardTitle tag="h4">Wallet balances</CardTitle>
				</CardHeader>
				<CardBody>
					<Alert color="warning" className="mb-0">
						<div className="alert-body">
							<AlertTriangle size={14} className="mr-50" />
							Not ready yet{missing.length ? ` — ${missing.join(' and ')} ${missing.length === 1 ? 'has' : 'have'} not been set up` : ''}. The
							database migration that adds them has not been applied.
						</div>
					</Alert>
				</CardBody>
			</Card>
		)
	}

	// if/else rather than a ternary: the repo's multiline-ternary rule is set to 'never', so a
	// ternary may not wrap at all and hoisting it to a const does not help.
	let sinceLabel = 'all time — these have never been reset'
	if (resetAt) {
		sinceLabel = `since ${new Date(resetAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}`
	}

	return (
		<Card>
			<CardHeader className="d-flex flex-wrap justify-content-between align-items-start">
				<div>
					<CardTitle tag="h4" className="mb-25">
						Wallet balances
					</CardTitle>
					{/* The period is part of the figure, not a footnote. Without it these read as
					    all-time totals, which is what they were before the reset. */}
					<small className="text-muted d-block">{sinceLabel}</small>
					<small className="text-muted d-block">What sales recovered, less what was spent. Not cash in the bank.</small>
				</div>
				<div className="text-right mt-1 mt-md-0">
					<h3 className={`font-weight-bolder mb-0 ${retained < 0 ? 'text-danger' : 'text-success'}`}>{naira(retained)}</h3>
					<small className="text-muted">retained {resetAt ? 'since reset' : 'all time'}</small>
				</div>
			</CardHeader>
			<CardBody>
				{/* Shown WITH the numbers, never instead of them. The previous tiles were wrong for
				    four months and this page said nothing, which is the failure this prevents. */}
				{!health?.ok && (
					<Alert color="warning">
						<div className="alert-body">
							<AlertTriangle size={14} className="mr-50" />
							{health?.drifted?.length > 0 && (
								<span>
									{health.drifted.length} wallet{health.drifted.length === 1 ? '' : 's'} no longer match their own ledger entries (
									{health.drifted.map((d) => d.name).join(', ')}). Treat these figures as unreliable until that is investigated.
								</span>
							)}
							{health?.drifted?.length === 0 && health?.unbookedOrders > 0 && (
								<span>
									{health.unbookedOrders} completed or delivered order{health.unbookedOrders === 1 ? '' : 's'} never reached the ledger, so
									these balances are short by that much.
								</span>
							)}
						</div>
					</Alert>
				)}

				<Row>
					{(wallets.wallets || []).map((w) => {
						const Icon = ICONS[w.name] || TrendingUp
						const negative = w.balance < 0
						return (
							<Col key={w.name} xl="2" md="4" sm="6" xs="6" className="mb-1">
								<div className="text-center px-25">
									<div className={`avatar p-50 m-0 mb-50 ${negative ? 'bg-light-danger' : 'bg-light-primary'}`}>
										<div className="avatar-content">
											<Icon size={18} />
										</div>
									</div>
									{/* Wraps rather than truncates: ₦145,243,999 is wider than a sixth of a
									    phone screen, and a silently clipped balance is a wrong balance. */}
									<h5 className={`font-weight-bolder mb-0 text-break ${negative ? 'text-danger' : ''}`}>{naira(w.balance)}</h5>
									<small className="text-muted d-block">{w.label}</small>
								</div>
							</Col>
						)
					})}
				</Row>

				<div className="mt-1 pt-1 border-top">
					<small className="text-muted">
						Overhead has no recovery envelope — no part of a sale is set aside for salaries, power or software — so it only ever falls.
						{resetNote ? ` Reset note: ${resetNote}.` : ''}
						{health?.legacyUnbooked > 0 && (
							<>
								{' '}
								<Badge color="light-secondary">
									{health.legacyUnbooked} pre-reset order{health.legacyUnbooked === 1 ? '' : 's'} unbooked
								</Badge>{' '}
								— no cost price was recorded against their lines, so they cannot be booked now.
							</>
						)}
					</small>
				</div>
			</CardBody>
		</Card>
	)
}

export default WalletBalances
