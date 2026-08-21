const initialState = {
	expenses: [],
	pagination: { total: 0, page: 1, limit: 50 },
	totalAmount: 0,
	summary: null,
	selectedExpense: null,
	selectedHistory: [],
	reference: { departments: [], categories: [], paymentAccounts: [], suppliers: [], draftBatches: [] },
	params: {},
	loading: false,
}

const expensesReducer = (state = initialState, action) => {
	switch (action.type) {
		case 'SET_EXPENSES_LOADING':
			return { ...state, loading: action.loading }
		case 'GET_EXPENSES':
			return {
				...state,
				expenses: action.data.expenses || [],
				pagination: action.data.pagination || initialState.pagination,
				// The API returns the total for the whole filtered set, not just this page, so
				// the header can say "50 of 812, NGN 4.1m" without a second request.
				totalAmount: action.data.totalAmount || 0,
				params: action.params || {},
			}
		case 'GET_EXPENSE_SUMMARY':
			return { ...state, summary: action.data }
		case 'GET_EXPENSE':
			return { ...state, selectedExpense: action.data, selectedHistory: action.history || [] }
		case 'GET_EXPENSE_REFERENCE':
			return { ...state, reference: action.data }
		default:
			return state
	}
}

export default expensesReducer
