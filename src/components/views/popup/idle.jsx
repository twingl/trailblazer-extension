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
    chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/tour.html") });
  }

  onManageDataClicked(evt) {
    evt.preventDefault();
    chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/offline-data.html") });
  }

  render() {
    return <div>
      <div style={{width: "100%", background: "#323232", color: "#EFEFEF", textAlign: "center", contain: "content", padding: "1rem 0"}}>
        <p>Trailblazer is shutting down</p>
        <p style={{marginTop: "2rem"}}>
          <a style={{background: "#EFEFEF", color: "#323232", padding: "8px 12px", borderRadius: "3px", textDecoration: "none"}}
            onClick={this.onManageDataClicked.bind(this)}
            href="/build/offline-data.html">Manage your data</a>
        </p>
      </div>
      <div className="wrap idle cf">
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
      </div>
    </div>;
  }

};

export default Idle;
