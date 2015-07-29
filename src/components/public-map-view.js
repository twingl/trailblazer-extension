var React = require('react');

//components
var PublicMapTitle = require('./public-map-title');
var ShareMap = require('./share-map');
var Legend = require('./legend');

import Trail from './trail';

module.exports = React.createClass({
  render: function () {
    var visible, shareText, title, url;

    visible       = this.props.assignment.visible; //state
    shareText     = (visible) ? "Shared" : "Share"; //state
    title         = this.props.assignment.title;
    url           = this.props.assignment.url;

    return  <div className="map-view-wrapper public">
              <PublicMapTitle title={this.props.assignment.title} />
              <div id="map-container" >
                <Trail id="map-container" svgId="map" nodes={this.props.nodes} actions={this.props.actions} />
              </div>
              <Legend hide={ ["active"] } />
            </div>;
  }

});
