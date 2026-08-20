// showValue starts FALSE, not true. The valuation columns are permission-gated server-side, and
// defaulting them on would render empty money columns for a storekeeper for one frame before the
// response lands — which reads as "this stock is worth nothing" rather than "you may not see it".
const initialState = {
	lines: [],
	movements: [],
	totals: {},
	asAt: null,
	showValue: false,
	loading: false,
}

const inventory = (state = initialState, action) => {
	switch (action.type) {
		case 'INVENTORY_LOADING':
			return { ...state, loading: action.loading }
		case 'GET_STOCK_ON_HAND':
			return {
				...state,
				lines: action.lines,
				totals: action.totals,
				asAt: action.asAt,
				showValue: action.showValue,
				loading: false,
			}
		case 'GET_INVENTORY_MOVEMENTS':
			return { ...state, movements: action.movements }
		default:
			return state
	}
}

export default inventory
