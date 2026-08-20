import { Zap } from 'react-feather'

// Production batches. The storekeeper enters them and never sees a purchase price: input cost
// is computed server-side from the fish ledger, and the cost columns on the batch screen are
// gated on inventory.readValuation, which `store` does not hold.
export default [
	{
		id: 'production',
		title: 'Production',
		icon: <Zap size={20} />,
		navLink: '/production/list',
	},
]
