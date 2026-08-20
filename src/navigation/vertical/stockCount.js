import { Clipboard } from 'react-feather'

// Counting is the storekeeper's job (stockCounts.manage); POSTING a count moves every balance
// it touches at once and sits with whoever may adjust one by hand. Both see this item.
export default [
	{
		id: 'stock-counts',
		title: 'Stock counts',
		icon: <Clipboard size={20} />,
		navLink: '/stock-counts/list',
	},
]
