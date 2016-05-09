import React from 'react';

import Constants from '../../../constants';

/**
 * The Idle popup view.
 * Displayed when the user is signed in, but the current tab is not recording.
 */
class Idle extends React.Component {

  onRecordClicked(evt) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      var tab = tabs[0];
      this.props.actions.startRecording(tab.id, tab);
    });
  }

  onViewTrailsClicked(evt) {
    chrome.tabs.create({ url: "/build/main-ui.html" });
  }

  onSignOutClicked(evt) {
    this.props.actions.signOut();
  }

  onTutorialClicked(evt) {
    chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/tour/sign-in.html") });
  }

  render() {
    return <div className="wrap idle cf">
      <a  className="button button-record start-recording"
          title="Record a New Trail"
          onClick={this.onRecordClicked.bind(this)}>

        <img src="/assets/icons/trail-icon.svg" />
      </a>

      <a  className="folder folder-view-trails"
          title="View my Trails"
          onClick={this.onViewTrailsClicked.bind(this)}>

        <img src="/assets/icons/folder-icon.svg" />
      </a>

      <a  className="sign-out"
          title="Sign Out"
          onClick={this.onSignOutClicked.bind(this)}>

        <img src="/assets/icons/sign-out-icon.svg" />
      </a>

      <a  className="tutorial"
          title="How to use Trailblazer"
          onClick={this.onTutorialClicked.bind(this)}>

        <img src="/assets/icons/tutorial-icon.svg" />
      </a>
    </div>;
  }

};

export default Idle;
