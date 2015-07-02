/** @jsx React.DOM */
var React           = require('react')
  , navigate        = require('react-mini-router').navigate
  , Star            = require('../star')
  , AssignmentTitle = require('../assignment-title');

module.exports = React.createClass({
  componentDidMount: function () {
    // Bind listener
    chrome.runtime.onMessage.addListener( function (message) {
      switch (message.action) {
        case this.props.constants.__change__:

        // If we hear a successful response then show the recording UI
        case this.props.constants.STOP_RECORDING_SUCCESS:
          if (message.payload.tabId === this.props.tabId) {
            navigate('/idle');
          }
          break;

        default:
          break;
      }
    }.bind(this));
  },

  onStopRecordingClicked: function (evt) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      var tab = tabs[0];
      this.props.actions.stopRecording(tab.id);
    }.bind(this));
  },

  onSignOutClicked: function (evt) {
    this.props.actions.signOut();
  },

  onTutorialClicked: function (evt) {
    chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/tour/sign-in.html") });
  },

  onViewTrailClicked: function (evt) {
    var url = chrome.runtime.getURL("/build/content.html#!/assignments/" + this.props.assignment.localId);
    chrome.tabs.create({ url: url });
  },

  render: function () {
    return <div className="wrap recording">
      <div className="recording-title" id="map-title">
        <AssignmentTitle
            assignment={this.props.assignment}
            actions={this.props.actions}
            constants={this.props.constants} />
      </div>

      <h2 className="recording-title state">Recording</h2>

      <a  className="button button-view-trail open-map"
          onClick={this.onViewTrailClicked}>
        View Trail
      </a>

      <a  className="button button-stop stop-recording"
          onClick={this.onStopRecordingClicked}>
        <img src="/assets/icons/stop-icon.svg" />
      </a>

      <div id="waypoint-div" title="Waypoint this page" >
        <Star node={this.props.node}
              actions={this.props.actions}
              constants={this.props.constants}
              width={16}
              height={15} />
      </div>

      <a  className="sign-out"
          title="Sign Out"
          onClick={this.onSignOutClicked}>

        <img src="/assets/icons/sign-out-icon.svg" />
      </a>

      <a  className="tutorial"
          title="How to use Trailblazer"
          onClick={this.onTutorialClicked}>

        <img src="/assets/icons/tutorial-icon.svg" />
      </a>
    </div>;
  }
});
