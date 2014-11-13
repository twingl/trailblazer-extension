/** @jsx React.DOM */
var React = require('react');

module.exports = React.createClass({
  render: function () {
    return  <div
              className={this.props.className} >
              {this.props.message}
            </div>;
  }
});