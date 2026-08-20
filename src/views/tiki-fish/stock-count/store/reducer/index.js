const initialState = {
	counts: [],
	count: null,
	lines: [],
	totals: {},
	loading: false
}

const stockCount = (state = initialState, action) => {
	switch (action.type) {
		case 'STOCK_COUNT_LOADING':
			return { ...state, loading: action.loading }
		case 'GET_STOCK_COUNTS':
			return { ...state, counts: action.counts, loading: false }
		case 'GET_STOCK_COUNT':
			return { ...state, count: action.count, lines: action.lines, totals: action.totals, loading: false }
		default:
			return state
	}
}

export default stockCount
