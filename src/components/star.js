/** @jsx React.DOM */
var React           = require('react')
  , messageChannel  = require('../util/message-channel');

module.exports = React.createClass({
  //TODO remove state from this class and place in higher level 'popup' parent component.
  getInitialState: function () {
    return {
      rank: this.props.node.rank
    }
  },

  componentDidMount: function () {
    // listen for `change` evts for the current node
    messageChannel.listen( function (message) {
      switch (message.action) {
        case this.props.constants.__change__:
          if (message.payload.store === "NodeStore" &&
              message.payload.node.localId === this.props.node.localId) {
            this.props.node.rank = message.payload.node.rank;
            this.setState({ rank: message.payload.node.rank });
          }
          break;
      }
    }.bind(this));
  },

  render: function () {
    var width = this.props.width + "px";
    var height= this.props.height + "px";
    var viewBox = "0 0 " + this.props.width  + " " + this.props.height;
    var waypointClass = this.state.rank === 1 ? "waypoint-active" : "waypoint";

    return  <a
              onClick={this.onClick}
              className={waypointClass} >
              <svg
                width={width}
                height={height}
                viewBox={viewBox}
                version="1.1">
                  <polygon
                    points="8 11.8125 3.29771798 14.2460088 4.19577393 9.09175442 0.39154787 5.44149117 5.64885899 4.68949558 8 0 10.351141 4.68949558 15.6084521 5.44149117 11.8042261 9.09175442 12.702282 14.2460088 ">
                  </polygon>
              </svg>
            </a>;
  },

  onClick: function () {
    messageChannel.send({
      action: "trackUIEvent",
      eventName: "ui.popup.waypoint.toggle",
      eventData: { }
    });

    if (this.props.node.rank === 1) {
      this.props.actions.rankNodeNeutral(this.props.node.localId);
    } else {
      this.props.actions.rankNodeWaypoint(this.props.node.localId);
    }
  }
});
