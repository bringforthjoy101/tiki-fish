const initialState = {
	pnl: null,
	departments: null,
	restatement: null,
	loading: false
}

const reports = (state = initialState, action) => {
	switch (action.type) {
		case 'REPORTS_LOADING':
			return { ...state, loading: action.loading }
		case 'GET_DEPARTMENTS_REPORT':
			return { ...state, departments: action.departments, loading: false }
		case 'GET_PNL':
			return { ...state, pnl: action.pnl, loading: false }
		case 'GET_RESTATEMENT':
			return { ...state, restatement: action.restatement, loading: false }
		default:
			return state
	}
}

export default reports
