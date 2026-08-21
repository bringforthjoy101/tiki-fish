import { FileText, TrendingUp, Shuffle } from 'react-feather'

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
				id: 'reports-restatement',
				title: 'What changed, and why',
				icon: <Shuffle size={16} />,
				navLink: '/reports/restatement',
				// 'reports.pnl' maps to { action: 'pnl', subject: 'reports' } — see
				// utility/capabilities.js. Writing resource: 'reports.pnl' would never match.
				action: 'pnl',
				resource: 'reports',
			},
		],
	},
]
