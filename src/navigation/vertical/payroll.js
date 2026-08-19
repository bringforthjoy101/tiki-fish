import { Users, Circle } from 'react-feather'
import { canAny } from '@src/utility/capabilities'

// Built per capability rather than as a fixed list. A manager holds workers.read and
// payroll.readStaffCostSummary and must see exactly two of these three; an owner sees all.
// The routes behind them are enforced server-side regardless of what renders here.
const children = []

if (canAny('workers.read', 'workers.readPay')) {
	children.push({
		id: 'payroll_workers',
		title: 'Workers',
		icon: <Circle size={12} />,
		navLink: '/payroll/workers',
	})
}

if (canAny('payroll.read')) {
	children.push({
		id: 'payroll_runs',
		title: 'Pay runs',
		icon: <Circle size={12} />,
		navLink: '/payroll/runs',
	})
}

if (canAny('payroll.readStaffCostSummary')) {
	children.push({
		id: 'payroll_staff_cost',
		title: 'Staff cost',
		icon: <Circle size={12} />,
		navLink: '/payroll/staff-cost',
	})
}

// An empty array when nothing is held, so navigation/vertical/index.js can spread it
// unconditionally and a capability-less admin gets no empty "Payroll" heading.
const section = []
if (children.length) {
	section.push({
		id: 'payroll',
		title: 'Payroll',
		icon: <Users size={20} />,
		children,
	})
}

export default section
