const initialState = {
	batches: [],
	totals: { count: 0, posted: 0, totalCost: 0 },
	batch: null,
	inputs: [],
	outputs: [],
	expenses: [],
	conversionCost: 0,
	// What posting would do. Held separately from the batch so a stale preview can never be
	// mistaken for what was actually posted.
	preview: null,
	reference: { departments: [], grades: [], products: [] },
	params: {},
	loading: false,
}

const productionReducer = (state = initialState, action) => {
	switch (action.type) {
		case 'SET_PRODUCTION_LOADING':
			return { ...state, loading: action.loading }
		case 'GET_BATCHES':
			return {
				...state,
				batches: action.data.batches || [],
				totals: action.data.totals || initialState.totals,
				params: action.params || {},
			}
		case 'GET_BATCH':
			return {
				...state,
				batch: action.data.batch,
				inputs: action.data.inputs || [],
				outputs: action.data.outputs || [],
				expenses: action.data.expenses || [],
				conversionCost: action.data.conversionCost || 0,
			}
		case 'GET_ALLOCATION_PREVIEW':
			return { ...state, preview: action.data }
		case 'CLEAR_BATCH':
			// Cleared on unmount. Without it, opening a second batch shows the previous one's
			// allocation for a frame — one batch's costs under another batch's reference.
			return { ...state, batch: null, inputs: [], outputs: [], expenses: [], preview: null, conversionCost: 0 }
		case 'GET_PRODUCTION_REFERENCE':
			return { ...state, reference: action.data }
		default:
			return state
	}
}

export default productionReducer
