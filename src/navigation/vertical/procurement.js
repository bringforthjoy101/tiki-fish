import { Truck } from 'react-feather'

// Fish procurement. A clerk holds fishPurchases.create and sees only what they keyed;
// a manager sees everything and can record payments. Enforced server-side either way.
export default [
	{
		id: 'procurement',
		title: 'Fish purchases',
		icon: <Truck size={20} />,
		navLink: '/procurement/list',
	},
]
