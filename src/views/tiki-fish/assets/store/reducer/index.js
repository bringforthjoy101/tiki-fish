const initialState = {
	assets: [],
	totals: { count: 0, inUseCount: 0, costOfAssetsInUse: 0, totalCost: 0 },
	unregisteredCapex: null,
	reference: { departments: [], categories: [], suppliers: [] },
	params: {},
	loading: false,
}

const assetsReducer = (state = initialState, action) => {
	switch (action.type) {
		case 'SET_ASSETS_LOADING':
			return { ...state, loading: action.loading }
		case 'GET_ASSETS':
			return {
				...state,
				assets: action.data.assets || [],
				totals: action.data.totals || initialState.totals,
				params: action.params || {},
			}
		case 'GET_UNREGISTERED_CAPEX':
			return { ...state, unregisteredCapex: action.data }
		case 'GET_ASSET_REFERENCE':
			return { ...state, reference: action.data }
		default:
			return state
	}
}

export default assetsReducer
