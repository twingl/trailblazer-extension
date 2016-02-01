import React from 'react';

//components
import PublicMapTitle from '../public-map-title';
import ShareMap from '../share-map';
import Legend from '../legend';

import Trail from '../trail';

export default class PublicMap extends React.Component {

  render() {
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

};
