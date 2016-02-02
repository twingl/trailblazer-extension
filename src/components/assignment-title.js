import React from 'react';

import Constants from '../constants';

export default class AssignmentTitle extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      editable: false,
      title: props.assignment.title
    };
  }

  componentDidMount() {
    chrome.runtime.onMessage.addListener((message) => {
      switch (message.action) {
        case Constants.__change__:
          if (message.storeName === "AssignmentStore" &&
              message.payload.assignment &&
              message.payload.assignment.localId === this.props.assignment.localId) {
            this.setState({ title: message.payload.assignment.title });
            this.forceUpdate();
          }
      }
    });
  }

  render() {
    var editable = this.state.editable;


    if (editable) {
      return <input
              className="map-title"
              type="text"
              autoFocus
              value={this.state.title}
              onChange={this.onChange.bind(this)}
              onBlur={this.onBlur.bind(this)}
              onFocus={this.onFocus.bind(this)}
              onKeyPress={this.onKeyPress.bind(this)} />;
    } else {
      return <a href="#" onClick={this.onIconClick.bind(this)} className="map-title">
                <span>{this.state.title}</span>
                <img
                  onClick={this.onIconClick.bind(this)}
                  src="/assets/icons/editable-icon.svg" />
              </a>;
    };
  }

  onFocus(evt) {
    evt.target.select();
  }

  onKeyPress(evt) {
    if (evt.key === 'Enter') this.onBlur();
    if (evt.key === 'Escape') {
      this.setState({title: this.props.assignment.title});
      this.setState({editable: false});
      this.onBlur();
    }
  }

  onIconClick(evt) {
    evt.preventDefault();
    this.setState({editable: true});
  }

  onChange(evt) {
    this.setState({title: evt.target.value});
  }

  onBlur(evt) {
    this.setState({editable: false});
    if (this.state.title !== this.props.assignment.title) {
      this.props.actions.updateAssignmentTitle(this.props.assignment.localId, this.state.title);
    };
  }

};
