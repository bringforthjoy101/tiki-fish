const initialState = {
	// Keyed by tab so switching tabs does not blank the one behind it.
	lists: {
		fishGrades: [],
		packagingItems: [],
		departments: [],
		expenseCategories: [],
		paymentAccounts: [],
	},
	aliases: { aliases: [], unreviewed: 0, added: 0 },
	loading: {},
}

const referenceReducer = (state = initialState, action) => {
	switch (action.type) {
		case 'SET_REFERENCE_LOADING':
			return { ...state, loading: { ...state.loading, [action.key]: action.loading } }
		case 'GET_REFERENCE_LIST':
			return { ...state, lists: { ...state.lists, [action.key]: action.data } }
		case 'GET_GRADE_ALIASES':
			return { ...state, aliases: action.data }
		default:
			return state
	}
}

export default referenceReducer
