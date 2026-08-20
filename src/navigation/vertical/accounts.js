import { CreditCard } from 'react-feather'

// Balances, movements, opening balances and hand-recorded money in or out. Creating and
// renaming accounts lives under Reference data — this is about what is IN them.
//
// Gated on paymentAccounts.readBalance, which the finance manager and owner hold and the
// storekeeper does not: seeing the cold room is not the same as seeing the bank.
export default [
	{
		id: 'payment-accounts',
		title: 'Accounts',
		icon: <CreditCard size={20} />,
		navLink: '/accounts',
	},
]
