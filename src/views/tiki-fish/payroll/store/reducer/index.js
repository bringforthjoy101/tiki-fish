const initialState = {
	workers: [],
	// Defaults to false, so a screen that renders before the first response shows no pay
	// columns rather than empty ones it then has to take away.
	payVisible: false,
	payRuns: [],
	payRun: null,
	staffCost: null,
	reference: { departments: [], paymentAccounts: [] },
	params: {},
	loading: false,
}

const payrollReducer = (state = initialState, action) => {
	switch (action.type) {
		case 'SET_PAYROLL_LOADING':
			return { ...state, loading: action.loading }
		case 'GET_WORKERS':
			return {
				...state,
				workers: action.data.workers || [],
				payVisible: Boolean(action.data.payVisible),
				params: action.params || {},
			}
		case 'GET_PAY_RUNS':
			return { ...state, payRuns: action.data || [], params: action.params || {} }
		case 'GET_PAY_RUN':
			return { ...state, payRun: action.data }
		case 'CLEAR_PAY_RUN':
			// Cleared on unmount: without this, opening a second run renders the previous one's
			// lines for a frame, which on this screen means showing one person's pay under
			// another person's name.
			return { ...state, payRun: null }
		case 'GET_STAFF_COST':
			return { ...state, staffCost: action.data, params: action.params || {} }
		case 'GET_PAYROLL_REFERENCE':
			return { ...state, reference: action.data }
		default:
			return state
	}
}

export default payrollReducer
