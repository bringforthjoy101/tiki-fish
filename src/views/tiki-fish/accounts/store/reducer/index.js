// inflowTracked starts FALSE. It is the honest default: until orders carry a payment account,
// these balances are money OUT and deliberate funding only. Defaulting it true would let the
// screen claim a full cash position for one frame before the response lands.
const initialState = {
	accounts: [],
	movements: [],
	pagination: {},
	cashPosition: 0,
	inflowTracked: false,
	loading: false
}

const accounts = (state = initialState, action) => {
	switch (action.type) {
		case 'ACCOUNTS_LOADING':
			return { ...state, loading: action.loading }
		case 'GET_ACCOUNT_BALANCES':
			return {
				...state,
				accounts: action.accounts,
				cashPosition: action.cashPosition,
				inflowTracked: action.inflowTracked,
				loading: false
			}
		case 'GET_ACCOUNT_MOVEMENTS':
			return { ...state, movements: action.movements, pagination: action.pagination }
		default:
			return state
	}
}

export default accounts
