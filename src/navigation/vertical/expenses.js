import { CreditCard } from 'react-feather'

// Rendered only when the admin holds a finance capability - see navigation/vertical/index.js.
// The route behind it is enforced server-side regardless.
export default [
	{
		id: 'expenses',
		title: 'Expenses',
		icon: <CreditCard size={20} />,
		navLink: '/expenses/list',
	},
]
