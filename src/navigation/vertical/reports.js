import { FileText, TrendingUp, Shuffle, PieChart, Archive, ShoppingBag } from 'react-feather'

// Split deliberately. A sales rep holds reports.operations, so a single item gated on
// anyOf(operations, pnl) put the company P&L one click from every sales account — the same
// shape of hole as the dashboard money block.
export default [
	{
		id: 'reports',
		title: 'Reports',
		icon: <FileText size={20} />,
		children: [
			{
				id: 'reports-pnl',
				title: 'Profit and loss',
				icon: <TrendingUp size={16} />,
				navLink: '/reports/pnl',
				// 'reports.pnl' maps to { action: 'pnl', subject: 'reports' } — see
				// utility/capabilities.js. Writing resource: 'reports.pnl' would never match.
				action: 'pnl',
				resource: 'reports',
			},
			{
				id: 'reports-sales',
				title: 'What sold',
				icon: <ShoppingBag size={16} />,
				navLink: '/reports/sales',
				action: 'pnl',
				resource: 'reports',
			},
			{
				id: 'reports-departments',
				title: 'By department',
				icon: <PieChart size={16} />,
				navLink: '/reports/departments',
				action: 'pnl',
				resource: 'reports',
			},
			{
				id: 'reports-restatement',
				title: 'What changed, and why',
				icon: <Shuffle size={16} />,
				navLink: '/reports/restatement',
				// 'reports.pnl' maps to { action: 'pnl', subject: 'reports' } — see
				// utility/capabilities.js. Writing resource: 'reports.pnl' would never match.
				action: 'pnl',
				resource: 'reports',
			},
			{
				id: 'reports-snapshots',
				title: 'Saved reports',
				icon: <Archive size={16} />,
				navLink: '/reports/snapshots',
				// Reading a saved copy needs reports.pnl, the same as reading the live report.
				// CREATING one is gated separately on periods.lock (owner only) in the button
				// itself — freezing a figure is the act somebody may later be held to.
				action: 'pnl',
				resource: 'reports',
			},
		],
	},
]
