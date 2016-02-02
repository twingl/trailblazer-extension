import React from 'react';

import Constants from '../../../constants';
import Star from '../../star';
import AssignmentTitle from '../../assignment-title';

class Recording extends React.Component {

  onStopRecordingClicked(evt) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      var tab = tabs[0];
      this.props.actions.stopRecording(tab.id);
    });
  }

  onSignOutClicked(evt) {
    this.props.actions.signOut();
  }

  onTutorialClicked(evt) {
    chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/tour/sign-in.html") });
  }

  onViewTrailClicked(evt) {
    var url = chrome.runtime.getURL(`/build/main-ui.html#!/assignments/${this.props.assignment.localId}`);
    chrome.tabs.create({ url });
  }

  render() {
    return <div className="wrap recording">
      <div className="recording-title" id="map-title">
        <AssignmentTitle assignment={this.props.assignment} />
      </div>

      <h2 className="recording-title state">Recording</h2>

      <a className="button button-view-trail open-map"
          onClick={this.onViewTrailClicked.bind(this)}>
        View Trail
      </a>

      <a className="button button-stop stop-recording"
          onClick={this.onStopRecordingClicked.bind(this)}>
        <img src="/assets/icons/stop-icon.svg" />
      </a>

      <div id="waypoint-div" title="Waypoint this page" >
        <Star node={this.props.node} width={16} height={15} />
      </div>

      <a className="sign-out"
          title="Sign Out"
          onClick={this.onSignOutClicked.bind(this)}>

        <img src="/assets/icons/sign-out-icon.svg" />
      </a>

      <a className="tutorial"
          title="How to use Trailblazer"
          onClick={this.onTutorialClicked.bind(this)}>

        <img src="/assets/icons/tutorial-icon.svg" />
      </a>
    </div>;
  }

};

export default Recording;
