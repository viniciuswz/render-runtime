/* global module */
import 'core-js/es6/symbol'
import 'core-js/fn/symbol/iterator'
import { prop } from 'ramda'
import { canUseDOM } from 'exenv'
import * as runtimeGlobals from './core/main'
import { createReactIntl } from './utils/reactIntl'

import { createCustomReactApollo } from './utils/reactApollo'
import { createLazyLinkElements, LazyLinkItem } from './utils/assets'

window.__RENDER_8_RUNTIME__ = { ...runtimeGlobals }

// compatibility
window.__RENDER_8_COMPONENTS__ =
  window.__RENDER_8_COMPONENTS__ || global.__RENDER_8_COMPONENTS__
window.__RENDER_8_HOT__ = window.__RENDER_8_HOT__ || global.__RENDER_8_HOT__
global.__RUNTIME__ = window.__RUNTIME__

let intlPolyfillPromise: Promise<void> = Promise.resolve()

if (window.IntlPolyfill) {
  window.IntlPolyfill.__disableRegExpRestore()
  if (!window.Intl) {
    window.Intl = window.IntlPolyfill
  }
}
if (
  window.Intl &&
  canUseDOM &&
  (!window.Intl.PluralRules || !window.Intl.RelativeTimeFormat)
) {
  intlPolyfillPromise = import('./intl-polyfill').then(prop('default'))
}

if (canUseDOM) {
  const style = document.createElement('style')
  style.type = 'text/css'
  style.innerHTML = `.no-transitions * {
    -webkit-transition: none !important;
    -moz-transition: none !important;
    -ms-transition: none !important;
    -o-transition: none !important;
  }`
  document.getElementsByTagName('head')[0].appendChild(style)
}

if (module.hot) {
  module.hot.accept('./core/main', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const hotGlobals = require('./core/main')
    window.__RENDER_8_RUNTIME__.ExtensionContainer =
      hotGlobals.ExtensionContainer
    window.__RENDER_8_RUNTIME__.ExtensionPoint = hotGlobals.ExtensionPoint
    window.__RENDER_8_RUNTIME__.LayoutContainer = hotGlobals.LayoutContainer
    window.__RENDER_8_RUNTIME__.Link = hotGlobals.Link
    window.__RENDER_8_RUNTIME__.Loading = hotGlobals.Loading
    window.__RENDER_8_RUNTIME__.buildCacheLocator = hotGlobals.buildCacheLocator
    runtimeGlobals.start()
  })
}

if (!window.__RUNTIME__.amp) {
  window.ReactAMPHTML = window.ReactAMPHTMLHelpers =
    typeof Proxy !== 'undefined'
      ? new Proxy(
          {},
          {
            get: (_, key) => {
              if (key === '__esModule' || key === 'constructor') {
                return
              }

              const message = canUseDOM
                ? 'You can not render AMP components on client-side'
                : 'You must check runtime.amp to render AMP components'

              throw new Error(message)
            },
          }
        )
      : {} // IE11 users will not have a clear error in this case
}

if (window.ReactApollo) {
  window.ReactApollo = createCustomReactApollo()
}

if (window.ReactIntl) {
  window.ReactIntl = createReactIntl()
}

function createLazyLinksTrigger() {
  const {
    __RUNTIME__: { uncriticalStyleRefs },
  } = window
  const criticalElement = document.querySelector('style#critical')

  if (!uncriticalStyleRefs || !criticalElement) {
    return () => {}
  }

  let lazyLinksPromise: Promise<Array<LazyLinkItem>>
  const loadPromise = new Promise((resolve) =>
    window.addEventListener('load', resolve)
  )

  window.__UNCRITICAL_PROMISE__ = loadPromise
    .then(() => lazyLinksPromise)
    .then((lazyLinks) => {
      if (!lazyLinks) {
        console.error('Missing lazy links')
        return
      }

      const debugCriticalCSS = window.__RUNTIME__.query?.__debugCriticalCSS

      const createUncriticalStyle = (lazyLink: LazyLinkItem) => {
        if (!lazyLink) {
          return
        }
        const style = document.createElement('style')

        style.id = lazyLink.id ?? ''
        style.className = lazyLink.className ?? ''
        style.media = lazyLink.media
        style.innerHTML = lazyLink.body

        document.head.appendChild(style)
      }

      const applyUncritical = () => {
        lazyLinks.forEach(createUncriticalStyle)
        criticalElement.remove()
      }

      if (debugCriticalCSS === 'manual') {
        ;(window as any).applyUncritical = applyUncritical

        let currentUncritical = 0
        ;(window as any).stepUncritical = () => {
          if (currentUncritical === -1) {
            console.log('Uncritical has finished being applied.')
          }
          const current = lazyLinks[currentUncritical]
          if (!current) {
            console.log('All uncritical styles applied. Cleaning critical.')
            criticalElement.remove()
            currentUncritical = -1
          }
          console.log('Applying uncritical style', current)
          createUncriticalStyle(current)
          currentUncritical++
        }
      } else {
        applyUncritical()
      }

      return
    })

  return () => {
    const { base = [], overrides = [] } = uncriticalStyleRefs
    lazyLinksPromise = createLazyLinkElements(
      [...base, ...overrides],
      criticalElement
    )
  }
}

if (window.__RUNTIME__.start && !window.__ERROR__) {
  if (canUseDOM) {
    const contentLoadedPromise = new Promise((resolve) =>
      window.addEventListener('DOMContentLoaded', resolve)
    )

    const triggerLazyLinks = createLazyLinksTrigger()
    Promise.all([contentLoadedPromise, intlPolyfillPromise]).then(() => {
      setTimeout(() => {
        window?.performance?.mark?.('render-start')
        window.__RENDER_8_RUNTIME__.start()
        window?.performance?.mark?.('render-end')
        window?.performance?.measure?.(
          '[VTEX IO] Rendering/Hydration',
          'render-start',
          'render-end'
        )
        triggerLazyLinks()
      }, 1)
    })
  } else {
    window.__RENDER_8_RUNTIME__.start()
  }
}
