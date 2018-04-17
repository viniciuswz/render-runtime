import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'

import ExtensionPoint from './ExtensionPoint'
import {createPortal} from './utils/dom'
import {getDirectChildren} from './utils/treePath'

class LegacyExtensionContainer extends Component<{}, {hydrate: boolean}> {
  public static contextTypes = {
    extensions: PropTypes.object,
    treePath: PropTypes.string,
  }

  public state = {
    hydrate: false
  }

  public context!: RenderContext

  public componentDidMount() {
    this.setState({hydrate: true})
  }

  public render() {
    const {extensions, treePath} = this.context
    const children = getDirectChildren(extensions, treePath)
    return children.map(id => createPortal(<ExtensionPoint id={id} />, id, this.state.hydrate))
  }
}

export default LegacyExtensionContainer
