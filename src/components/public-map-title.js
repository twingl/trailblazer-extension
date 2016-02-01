import React from 'react';

export default class PublicMapTitle extends React.Component {
  render() {
    return  <div>
              <div
                id="title"
                className="map-title">
                <h1>{this.props.title}</h1>
              </div>
              <div
                id="get-trailblazer">
                <a href="http://trailblazer.io/" target="_blank">Get Trailblazer</a>
              </div>
            </div>;
  }
};
