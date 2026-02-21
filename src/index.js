// ** React Imports
import { Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom'

// ** Redux Imports
import { Provider } from 'react-redux'
import { store } from './redux/storeConfig/store'

// ** Intl, CASL & ThemeColors Context
import ability from './configs/acl/ability'
import { ToastContainer } from 'react-toastify'
import { AbilityContext } from './utility/context/Can'
import { ThemeContext } from './utility/context/ThemeColors'
import { IntlProviderWrapper } from './utility/context/Internationalization'

// ** Socket.IO
import { initSocketStore, connectSocket } from './utility/socket'

// ** Spinner (Splash Screen)
import Spinner from './@core/components/spinner/Fallback-spinner'

// ** Ripple Button
import './@core/components/ripple-button'

// ** Fake Database
import './@fake-db'

// ** PrismJS
import 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-jsx.min'

// ** React Perfect Scrollbar
import 'react-perfect-scrollbar/dist/css/styles.css'

// ** React Toastify
import '@styles/react/libs/toastify/toastify.scss'

// ** Core styles
import './@core/assets/fonts/feather/iconfont.css'
import './@core/scss/core.scss'
import './assets/scss/style.scss'

// ** Service Worker
import * as serviceWorker from './serviceWorker'

// ** Lazy load app
const LazyApp = lazy(() => import('./App'))

// ** Initialize socket store reference
initSocketStore(store)

// ** Socket initializer — connects socket when admin is already logged in (e.g. page refresh)
const SocketInitializer = () => {
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'))
      if (userData && userData.accessToken) {
        connectSocket(userData.accessToken)
      }
    } catch (err) {
      // Silently ignore parse errors
    }
  }, [])
  return null
}

ReactDOM.render(
  <Provider store={store}>
    <SocketInitializer />
    <Suspense fallback={<Spinner />}>
      <AbilityContext.Provider value={ability}>
        <ThemeContext>
          <IntlProviderWrapper>
            <LazyApp />
            <ToastContainer newestOnTop />
          </IntlProviderWrapper>
        </ThemeContext>
      </AbilityContext.Provider>
    </Suspense>
  </Provider>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
