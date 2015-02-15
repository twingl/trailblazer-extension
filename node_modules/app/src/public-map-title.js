/** @jsx React.DOM */
var React = require('react');

module.exports = React.createClass({
  render: function () {
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
});
