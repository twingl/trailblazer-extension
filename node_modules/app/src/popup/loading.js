/** @jsx React.DOM */
var React       = require('react')
  , navigate    = require('react-mini-router').navigate;

module.exports = React.createClass({
  render: function () {
    return <div className="wrap loading"></div>;
  }
});
