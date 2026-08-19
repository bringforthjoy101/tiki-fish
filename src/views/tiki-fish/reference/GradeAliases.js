import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardBody, CardHeader, CardTitle, Button, Table, Badge, Spinner, Input, Alert } from 'reactstrap'
import { RefreshCw } from 'react-feather'
import { getGradeAliases, mapGradeAlias, getReferenceList } from './store/action'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

/**
 * The mapping worklist: every distinct name ever typed into a supply, and what it means.
 *
 * "Not fish" is an explicit choice, not the absence of one. Firewood and packaging are the
 * majority of these strings, and a list where unreviewed and not-fish look identical can
 * never be finished — you would have no way to tell what is left.
 */
const GradeAliases = () => {
	const dispatch = useDispatch()
	const { aliases, lists, loading } = useSelector((s) => s.reference)
	const [savingId, setSavingId] = useState(null)
	const [onlyUnreviewed, setOnlyUnreviewed] = useState(false)

	useEffect(() => {
		dispatch(getGradeAliases(false))
		dispatch(getReferenceList('fishGrades', '/fish-grades', true))
	}, [])

	const grades = lists.fishGrades || []
	const rows = (aliases.aliases || []).filter((a) => !onlyUnreviewed || !a.reviewedAt)

	const choose = async (alias, value) => {
		setSavingId(alias.id)
		// '' is "no decision yet" and is not sent; NOT_FISH is a decision and is sent as null.
		const ok = value === '' ? false : await dispatch(mapGradeAlias(alias.id, value === 'NOT_FISH' ? null : value))
		setSavingId(null)
		if (ok) dispatch(getGradeAliases(false))
	}

	const unreviewed = aliases.unreviewed || 0
	let emptyMessage = 'No names yet — press “Check for new names” to read them from supplies.'
	if (onlyUnreviewed) emptyMessage = 'Nothing left to review.'

	return (
		<Card>
			<CardHeader className="d-flex justify-content-between align-items-center flex-wrap">
				<div>
					<CardTitle tag="h4" className="mb-25">
						Legacy names
					</CardTitle>
					<small className="text-muted">
						Every name ever typed into a supply, and the grade it means. {unreviewed} still to review.
					</small>
				</div>
				<Button color="primary" outline onClick={() => dispatch(getGradeAliases(true))}>
					<RefreshCw size={15} /> Check for new names
				</Button>
			</CardHeader>

			<CardBody>
				{grades.length === 0 && (
					<Alert color="warning" className="p-1">
						Add your fish grades first, on the <b>Fish species &amp; grades</b> tab. There is nothing to map these
						names onto yet.
					</Alert>
				)}

				<div className="mb-1">
					<Button
						size="sm"
						color={onlyUnreviewed ? 'primary' : 'flat-primary'}
						onClick={() => setOnlyUnreviewed(!onlyUnreviewed)}
					>
						{onlyUnreviewed ? 'Showing what is left' : 'Show only what is left'}
					</Button>
				</div>

				{loading.aliases ? (
					<div className="text-center py-3">
						<Spinner />
					</div>
				) : (
					<div style={{ overflowX: 'auto' }}>
						<Table responsive hover size="sm">
							<thead>
								<tr>
									<th>Name as typed</th>
									<th className="text-right">Times used</th>
									<th className="text-right">Total</th>
									<th style={{ minWidth: 220 }}>Means</th>
								</tr>
							</thead>
							<tbody>
								{rows.length === 0 && (
									<tr>
										<td colSpan="4" className="text-center text-muted py-3">
											{emptyMessage}
										</td>
									</tr>
								)}
								{rows.map((a) => (
									<tr key={a.id}>
										<td>
											{/* Rendered inside brackets: a trailing space is invisible otherwise, and
											    'Tab' and 'Tab ' are two separate rows here for exactly that reason. */}
											<code>[{a.alias}]</code>
										</td>
										<td className="text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
											{a.uses}
										</td>
										<td className="text-right text-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
											{naira(a.naira)}
										</td>
										<td>
											<div className="d-flex align-items-center">
												<Input
													type="select"
													bsSize="sm"
													value={a.reviewedAt ? a.speciesGradeId || 'NOT_FISH' : ''}
													onChange={(e) => choose(a, e.target.value)}
												>
													<option value="">Not reviewed</option>
													{grades.map((g) => (
														<option key={g.id} value={g.id}>
															{g.name}
														</option>
													))}
													<option value="NOT_FISH">Not fish (firewood, packaging, other)</option>
												</Input>
												<span style={{ width: 26 }} className="ml-50">
													{savingId === a.id && <Spinner size="sm" />}
													{savingId !== a.id && a.reviewedAt && (
														<Badge color={a.speciesGradeId ? 'light-success' : 'light-secondary'}>✓</Badge>
													)}
												</span>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</Table>
					</div>
				)}
			</CardBody>
		</Card>
	)
}

export default GradeAliases
