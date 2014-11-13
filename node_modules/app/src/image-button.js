/** @jsx React.DOM */
var React = require('react');

module.exports = React.createClass({
  render: function () {
    return  <a
              className={this.props.className}
              title={this.props.title}
              onClick={this.props.onClick}
              href="#" >
              <img src={this.props.img} ></img>
            </a> ;
  }
});