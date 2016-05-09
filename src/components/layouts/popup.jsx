import React from 'react';

import ChromeIdentityAdapter from '../../adapter/chrome_identity_adapter';
import Constants from '../../constants';
import queries from '../../queries';

import * as Popup from '../views/popup';

class Layout extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      signedIn: null,
      assignment: null,
      node: null,
      recording: null
    }
  }

  componentWillMount() {
    // Set up auth information
    new ChromeIdentityAdapter().isSignedIn().then((signedIn) => {
      this.setState({ signedIn });
    });

    chrome.runtime.onMessage.addListener((message) => {
      switch (message.action) {
        case Constants.__change__:
          // If we hear about a change in the tab store, update the tab state
          if (message.payload.store === "TabStore") {
            queries.TabStore.getTabState(this.props.tabId).then(({ recording, assignment, node }) => {
              this.setState({ recording, assignment, node });
            });
          }

          // If we hear about an authentication change, check auth state
          if (message.payload.store === "AuthenticationStore") {
            new ChromeIdentityAdapter().isSignedIn().then((signedIn) => {
              this.setState({ signedIn });
            });
          }
      }
    });

    queries.TabStore.getTabState(this.props.tabId).then(({ recording, assignment, node }) => {
      this.setState({ recording, assignment, node });
    });
  }

  render() {
    if (this.state.assignment && this.state.assignment && this.state.recording === true) {
      return <Popup.Recording
        tabId={this.props.tabId}
        assignment={this.state.assignment}
        node={this.state.node}
        actions={this.props.actions} />

    } else if (this.state.signedIn === true) {
      return <Popup.Idle tabId={this.props.tabId} actions={this.props.actions} />

    } else if (this.state.signedIn === false) {
      return <Popup.SignIn tabId={this.props.tabId} actions={this.props.actions} />

    } else {
      return <Popup.Loading tabId={this.props.tabId} actions={this.props.actions} />
    }
  }

};

export default Layout;
