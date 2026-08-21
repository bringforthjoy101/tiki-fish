// ** Initial State
const initialState = {
  allData: [],
  data: [],
  total: 1,
  params: {},
  // Computed by the server over everything matching the filter — NOT over the rows on screen.
  summary: { totalOrders: 0, totalValue: 0, byStatus: {} },
  selectedOrder: null
}

const orders = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_ALL_ORDERS_DATA':
      return { ...state, allData: action.data }
    case 'GET_FILTERED_ORDER_DATA':
      return {
        ...state,
        data: action.data,
        total: action.totalPages,
        summary: action.summary || state.summary,
        params: action.params
      }
    case 'GET_ORDER':
      return { ...state, selectedOrder: action.selectedOrder }
    default:
      return { ...state }
  }
}
export default orders
