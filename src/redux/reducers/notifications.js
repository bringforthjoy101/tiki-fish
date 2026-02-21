const initialState = {
  unseenOrderCount: 0
}

const notificationsReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_ORDER_NOTIFICATION':
      return { ...state, unseenOrderCount: state.unseenOrderCount + 1 }
    case 'RESET_ORDER_NOTIFICATIONS':
      return { ...state, unseenOrderCount: 0 }
    case 'LOGOUT':
      return initialState
    default:
      return state
  }
}

export default notificationsReducer
