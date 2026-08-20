import { Layers } from 'react-feather'

// Stock on hand for the fish and packaging ledgers, and the count sheet printed from it.
// Gated on inventory.read, which the storekeeper holds — seeing what is in the cold room is not
// the same as being allowed to write off the difference, which is inventory.adjust.
export default [
	{
		id: 'inventory',
		title: 'Stock on hand',
		icon: <Layers size={20} />,
		navLink: '/inventory/stock-on-hand',
	},
]
