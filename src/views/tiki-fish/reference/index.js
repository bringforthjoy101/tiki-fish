import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Nav, NavItem, NavLink, TabContent, TabPane, Badge } from 'reactstrap'
import { canAny } from '@src/utility/capabilities'
import ReferenceTable from './ReferenceTable'
import GradeAliases from './GradeAliases'
import { getReferenceList } from './store/action'

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`

/**
 * Reference data.
 *
 * There was no maintenance screen for any of this. departments, expense categories and
 * payment accounts have had full CRUD routes and *.manage capabilities since Phase 1, and the
 * front end only ever GET them to fill dropdowns — so adding a category meant asking a
 * developer. Replacing 32 free-text fish names with a dropdown would just move that
 * bottleneck rather than remove it.
 */
const ReferenceData = () => {
	const dispatch = useDispatch()
	const { lists, aliases } = useSelector((s) => s.reference)
	const [active, setActive] = useState('grades')

	// Categories and departments are needed as dropdown options inside other tabs' forms.
	useEffect(() => {
		dispatch(getReferenceList('expenseCategories', '/expense-categories', true))
		dispatch(getReferenceList('departments', '/departments', true))
	}, [])

	const options = (key, labelField = 'name') =>
		(lists[key] || []).map((r) => ({ value: r.id, label: r[labelField] }))

	const CONFIGS = {
		grades: {
			key: 'fishGrades',
			title: 'Fish species & grades',
			blurb: 'What you buy, named once. Every purchase and every report groups by these.',
			emptyMessage: 'No grades yet. Add the ones you actually buy — about four, by your own count.',
			endpoint: '/fish-grades',
			manageCapability: 'fishGrades.manage',
			columns: [
				{ label: 'Name', field: 'name' },
				{ label: 'Code', render: (r) => <code>{r.code}</code> },
				{ label: 'Species', field: 'species' },
				{ label: 'Bought by', render: (r) => (r.defaultUnit === 'kg' ? 'Weight (kg)' : 'Piece') },
				{
					label: 'Avg weight',
					align: 'right',
					render: (r) => (r.averageWeightKg ? `${r.averageWeightKg} kg` : '—'),
				},
			],
			fields: [
				{ name: 'name', label: 'Name', required: true, width: 8, placeholder: 'e.g. Table size catfish' },
				{ name: 'code', label: 'Code', required: true, width: 4, placeholder: 'TABLE', help: 'Short, stable. Reports match on this.' },
				{ name: 'species', label: 'Species', width: 6, defaultValue: 'African catfish' },
				{ name: 'grade', label: 'Grade / size band', width: 6, placeholder: 'e.g. 1kg+' },
				{
					name: 'defaultUnit',
					label: 'Normally bought by',
					type: 'select',
					width: 6,
					defaultValue: 'kg',
					options: [
						{ value: 'kg', label: 'Weight (kg)' },
						{ value: 'pcs', label: 'Piece' },
					],
				},
				{
					name: 'averageWeightKg',
					label: 'Average weight per piece (kg)',
					type: 'number',
					step: '0.001',
					width: 6,
					showIf: (f) => f.defaultUnit === 'pcs',
					help: 'Only if you buy by piece but use by weight. Leave blank and a batch needing the conversion is refused rather than guessed.',
				},
				{ name: 'notes', label: 'Notes', type: 'textarea' },
			],
		},
		packaging: {
			key: 'packagingItems',
			title: 'Packaging items',
			blurb: 'Cartons, jars, tape, labels. Kept separate from products — these are not for sale.',
			emptyMessage: 'No packaging items yet.',
			endpoint: '/packaging-items',
			manageCapability: 'packagingItems.manage',
			columns: [
				{ label: 'Name', field: 'name' },
				{ label: 'Code', render: (r) => <code>{r.code}</code> },
				{ label: 'Unit', field: 'unit' },
				{ label: 'Books under', render: (r) => r.expenseCategory?.name || '—' },
				{ label: 'Reorder at', align: 'right', render: (r) => (r.reorderLevel ? `${r.reorderLevel}` : '—') },
			],
			fields: [
				{ name: 'name', label: 'Name', required: true, width: 8, placeholder: 'e.g. Carton, large' },
				{ name: 'code', label: 'Code', required: true, width: 4, placeholder: 'CTN-L' },
				{
					name: 'unit',
					label: 'Unit',
					type: 'select',
					width: 6,
					defaultValue: 'pcs',
					options: [
						{ value: 'pcs', label: 'Pieces' },
						{ value: 'pack', label: 'Packs' },
						{ value: 'carton', label: 'Cartons' },
						{ value: 'roll', label: 'Rolls' },
						{ value: 'kg', label: 'Kilograms' },
						{ value: 'l', label: 'Litres' },
					],
				},
				{
					name: 'categoryId',
					label: 'Purchases book under',
					type: 'select',
					width: 6,
					options: () => options('expenseCategories'),
				},
				{
					name: 'reorderLevel',
					label: 'Tell me when stock falls below',
					type: 'number',
					step: '0.001',
					width: 6,
					help: 'Informational. Nothing is blocked when it is reached.',
				},
				{ name: 'notes', label: 'Notes', type: 'textarea' },
			],
		},
		departments: {
			key: 'departments',
			title: 'Departments',
			blurb: 'Every expense, wage and asset is attributed to one of these.',
			endpoint: '/departments',
			manageCapability: 'departments.manage',
			columns: [
				{ label: 'Name', field: 'name' },
				{ label: 'Code', render: (r) => <code>{r.code}</code> },
				{ label: 'Description', field: 'description' },
			],
			fields: [
				{ name: 'name', label: 'Name', required: true, width: 8 },
				{ name: 'code', label: 'Code', required: true, width: 4 },
				{ name: 'description', label: 'Description', type: 'textarea' },
			],
		},
		categories: {
			key: 'expenseCategories',
			title: 'Expense categories',
			blurb: 'What an expense is for. Add your own — nothing here is fixed in code.',
			endpoint: '/expense-categories',
			manageCapability: 'expenseCategories.manage',
			columns: [
				{ label: 'Name', field: 'name' },
				{ label: 'Usual department', render: (r) => r.department?.name || '—' },
			],
			fields: [
				{ name: 'name', label: 'Name', required: true },
				{
					name: 'defaultDepartmentId',
					label: 'Usually belongs to',
					type: 'select',
					options: () => options('departments'),
					help: 'Pre-fills the department on the expense form. The clerk can still change it.',
				},
			],
		},
		accounts: {
			key: 'paymentAccounts',
			title: 'Payment accounts',
			blurb: 'Where money actually sits. Balances are derived from movements, never stored.',
			endpoint: '/payment-accounts',
			manageCapability: 'paymentAccounts.manage',
			columns: [
				{ label: 'Name', field: 'name' },
				{ label: 'Type', field: 'type' },
				{ label: 'Bank', field: 'bankName' },
				{ label: 'Opening balance', align: 'right', render: (r) => naira(r.openingBalance) },
			],
			fields: [
				{ name: 'name', label: 'Name', required: true, width: 8, placeholder: 'e.g. GTBank current' },
				{
					name: 'type',
					label: 'Type',
					type: 'select',
					width: 4,
					defaultValue: 'bank',
					options: [
						{ value: 'bank', label: 'Bank' },
						{ value: 'cash', label: 'Cash on hand' },
						{ value: 'pos', label: 'POS' },
						{ value: 'mobile_money', label: 'Mobile money' },
					],
				},
				{ name: 'bankName', label: 'Bank', width: 6 },
				{ name: 'accountNumber', label: 'Account number', width: 6 },
			],
		},
	}

	const TABS = [
		{ id: 'grades', label: 'Fish species & grades', show: canAny('fishGrades.read', 'fishGrades.manage') },
		{ id: 'aliases', label: 'Legacy names', show: canAny('fishGrades.manage'), badge: aliases.unreviewed },
		{ id: 'packaging', label: 'Packaging items', show: canAny('packagingItems.read', 'packagingItems.manage') },
		{ id: 'departments', label: 'Departments', show: canAny('departments.read', 'departments.manage') },
		{ id: 'categories', label: 'Expense categories', show: canAny('expenseCategories.read', 'expenseCategories.manage') },
		{ id: 'accounts', label: 'Payment accounts', show: canAny('paymentAccounts.read', 'paymentAccounts.manage') },
	].filter((t) => t.show)

	return (
		<div className="reference-data">
			<Nav tabs className="mb-1">
				{TABS.map((t) => (
					<NavItem key={t.id}>
						<NavLink active={active === t.id} onClick={() => setActive(t.id)} style={{ cursor: 'pointer' }}>
							{t.label}
							{t.badge > 0 && (
								<Badge color="light-warning" className="ml-50">
									{t.badge}
								</Badge>
							)}
						</NavLink>
					</NavItem>
				))}
			</Nav>

			<TabContent activeTab={active}>
				{TABS.map((t) => (
					<TabPane tabId={t.id} key={t.id}>
						{active === t.id && (t.id === 'aliases' ? <GradeAliases /> : <ReferenceTable config={CONFIGS[t.id]} />)}
					</TabPane>
				))}
			</TabContent>
		</div>
	)
}

export default ReferenceData
