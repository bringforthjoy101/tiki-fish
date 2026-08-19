import { Package } from 'react-feather'

// Rendered only when the admin holds assets.read - see navigation/vertical/index.js. Manager
// and above; the register carries what things cost, which is a money figure.
export default [
	{
		id: 'assets',
		title: 'Asset register',
		icon: <Package size={20} />,
		navLink: '/assets/list',
	},
]
