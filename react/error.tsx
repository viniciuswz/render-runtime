/* global module */
import React, { Component, Fragment } from 'react'
import ReactJson from 'react-json-view'

require('myvtex-sse')

const ERROR_PAGE_COMPONENT = 'ErrorPage'

import ErrorImg from './images/error-img.png'

import style from './error.css'

const toSplunkLink = (rid: string) =>
  `https://splunk72.vtex.com/en-US/app/vtex_io_apps/search?q=search%20index%3Dvtex_io_logs%20app%3Dvtex.render-server%40*%20data.requestId%3D${rid}&display.page.search.mode=verbose&dispatch.sample_ratio=1&earliest=-5m%40m&latest=now`

class ErrorPage extends Component {
  public state = { enabled: false }
  private splunk = 0

  public componentDidMount() {
    window.setTimeout(() => {
      this.setState({ enabled: true })
    }, 5000)
  }

  public render() {
    return (
      <div className="h-100 flex flex-column mh6 mh0-ns error-height pt3 pt10-ns">
        <div>
          {this.renderErrorInfo()}
          {window.__ERROR__ && this.renderErrorDetails(window.__ERROR__)}
        </div>
      </div>
    )
  }

  private renderErrorInfo = () => {
    const date = new Date()

    return (
      <div className="flex justify-center-ns flex-row-ns flex-column-reverse h-auto-ns pt0-ns pb8">
        <div className="mr9-ns mr0">
          <div className="f2 c-on-base">Something went wrong</div>
          <div className="f5 pt5 c-on-base lh-copy">
            <div>There was a technical problem loading this page.</div>
            <div>Try refreshing the page or come back in 5 minutes.</div>
          </div>
          <div
            className="f6 pt5 c-muted-2"
            style={{ fontFamily: 'courier, code' }}
          >
            <div>ID: {window.__REQUEST_ID__}</div>
            <div className="f6 c-muted-2 lh-copy fw7">{date.toUTCString()}</div>
          </div>
          <div className="pt7">
            <button
              className={
                'bw1 ba fw5 ttu br2 fw4 v-mid relative pv4 ph6 f5 ' +
                (this.state.enabled
                  ? 'bg-action-primary b--action-primary c-on-action-primary hover-bg-action-primary hover-b--action-primary hover-c-on-action-primary pointer'
                  : 'bg-disabled b--disabled c-on-disabled')
              }
              disabled={!this.state.enabled}
              onClick={() => {
                window.location.reload()
              }}
            >
              Refresh
            </button>
          </div>
        </div>
        <div>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <img
            src={ErrorImg}
            onKeyDown={(e) => e.key === 'Enter' && this.handleImageClick()}
            onClick={this.handleImageClick}
            className={`${style.imgHeight} pb6 pb0-ns`}
            alt=""
          />
        </div>
      </div>
    )
  }

  private renderErrorDetails = (error: any) => {
    return (
      <div>
        <div
          className={`${style.errorStack} bg-danger--faded pa7 mt4 br3 t-body lh-copy`}
        >
          {error.stack.split('\n').map((item: string, key: number) => {
            return (
              <Fragment key={key}>
                {item}
                <br />
              </Fragment>
            )
          })}
        </div>
        <div
          className={`${style.errorDetails} bg-warning--faded pa7 mt4 br3 lh-copy`}
        >
          <ReactJson src={error.details} />
        </div>
      </div>
    )
  }

  private handleImageClick = () => {
    if (this.splunk < 2) {
      this.splunk = this.splunk + 1
    } else {
      window.open(toSplunkLink(window.__REQUEST_ID__), '_blank')
      this.splunk = 0
    }
  }
}

if (window.__ERROR__) {
  // compatibility
  window.__RENDER_8_COMPONENTS__ =
    window.__RENDER_8_COMPONENTS__ || global.__RENDER_8_COMPONENTS__
  window.__RENDER_8_HOT__ = window.__RENDER_8_HOT__ || global.__RENDER_8_HOT__
  global.__RUNTIME__ = window.__RUNTIME__
  window.__RENDER_8_COMPONENTS__[ERROR_PAGE_COMPONENT] = ErrorPage as any

  const start = () => {
    global.__RUNTIME__.extensions = global.__RUNTIME__.extensions || {}
    global.__RUNTIME__.pages = global.__RUNTIME__.pages || {}
    global.__RUNTIME__.components = global.__RUNTIME__.components || {}
    global.__RUNTIME__.disableSSR = true
    global.__RUNTIME__.extensions.error = {
      component: ERROR_PAGE_COMPONENT,
      extraComponents: [],
      props: {},
    }

    window.__RENDER_8_RUNTIME__.render('error', global.__RUNTIME__)
  }

  document.addEventListener('DOMContentLoaded', start)

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
      window.__RENDER_8_RUNTIME__.buildCacheLocator =
        hotGlobals.buildCacheLocator
      start()
    })
  } else {
    const CLOSED = 2
    let eventSource: any
    const initSSE = () => {
      const hasNoSSE = !eventSource || eventSource.readyState === CLOSED
      if (!document.hidden && hasNoSSE) {
        eventSource = window.myvtexSSE(
          global.__RUNTIME__.account,
          global.__RUNTIME__.workspace,
          'vtex.builder-hub:*:build.status',
          { verbose: true },
          (event: any) => {
            if (event.body && event.body.code === 'success') {
              window.location.reload()
            }
          }
        )
      }
    }
    initSSE()
    document.addEventListener('visibilitychange', initSSE)
  }
}
