import { io } from 'socket.io-client'
import { toast, Slide } from 'react-toastify'
import { Fragment } from 'react'
import Avatar from '@components/avatar'
import { ShoppingBag } from 'react-feather'

const apiUrl = process.env.REACT_APP_API_ENDPOINT

let socket = null
let reduxStore = null

// Give the socket module access to Redux store (called once from index.js)
export const initSocketStore = (store) => {
  reduxStore = store
}

// Web Audio API notification beep
const playNotificationBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(600, ctx.currentTime)

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  } catch (err) {
    // Silently fail — browser may block audio before user interaction
  }
}

// Toast content component for new order notifications
const NewOrderToast = ({ orderNumber, customerName, subtotal, orderId }) => (
  <Fragment>
    <div className='toastify-header'>
      <div className='title-wrapper'>
        <Avatar size='sm' color='info' icon={<ShoppingBag size={12} />} />
        <h6 className='toast-title font-weight-bold'>New Shop Order!</h6>
      </div>
    </div>
    <div className='toastify-body'>
      <span>
        Order #{orderNumber} from {customerName} — ₦{Number(subtotal).toLocaleString()}
      </span>
    </div>
  </Fragment>
)

export const connectSocket = (token) => {
  // Don't create duplicate connections
  if (socket?.connected) return

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect()
    socket = null
  }

  socket = io(apiUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.log('Socket connection error:', err.message)
  })

  socket.on('new-shop-order', (data) => {
    console.log('New shop order received:', data)

    // Dispatch Redux action to increment badge count
    if (reduxStore) {
      reduxStore.dispatch({ type: 'ADD_ORDER_NOTIFICATION' })
    }

    // Play notification sound
    playNotificationBeep()

    // Show toast notification
    toast.info(
      <NewOrderToast
        orderNumber={data.orderNumber}
        customerName={data.customerName}
        subtotal={data.subtotal}
        orderId={data.orderId}
      />,
      {
        transition: Slide,
        hideProgressBar: true,
        autoClose: 8000,
        onClick: () => {
          window.location.href = `/order/preview/${data.orderId}`
        }
      }
    )
  })

  // Listen for order-updated event (for future use)
  socket.on('order-updated', (data) => {
    console.log('Order updated:', data)
  })
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log('Socket manually disconnected')
  }
}

export const getSocket = () => socket
