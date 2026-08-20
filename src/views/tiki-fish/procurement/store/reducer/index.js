const initialState = {
	purchases: [],
	totals: { count: 0, landedCost: 0, outstanding: 0 },
	purchase: null,
	lines: [],
	payments: [],
	summary: null,
	cashOut: null,
	reference: { suppliers: [], departments: [], categories: [], grades: [], paymentAccounts: [] },
	params: {},
	loading: false,
}

const procurementReducer = (state = initialState, action) => {
	switch (action.type) {
		case 'SET_PROCUREMENT_LOADING':
			return { ...state, loading: action.loading }
		case 'GET_FISH_PURCHASES':
			return {
				...state,
				purchases: action.data.purchases || [],
				totals: action.data.totals || initialState.totals,
				params: action.params || {},
			}
		case 'GET_FISH_PURCHASE':
			return {
				...state,
				purchase: action.data.purchase,
				lines: action.data.lines || [],
				payments: action.data.payments || [],
			}
		case 'CLEAR_FISH_PURCHASE':
			// Cleared on unmount: without it, opening a second purchase shows the previous
			// one's lines for a frame - one supplier's prices under another's name.
			return { ...state, purchase: null, lines: [], payments: [] }
		case 'GET_PURCHASE_SUMMARY':
			return { ...state, summary: action.data }
		case 'GET_FISH_CASH_OUT':
			return { ...state, cashOut: action.data }
		case 'GET_PROCUREMENT_REFERENCE':
			return { ...state, reference: action.data }
		default:
			return state
	}
}

export default procurementReducer
