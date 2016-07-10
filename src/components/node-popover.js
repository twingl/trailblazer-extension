import React from 'react';

import classnames from 'classnames';

export default class NodePopover extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      visible: false
    };

    this.position = props.position;
    this.mouseInBounds;
    this.mouseInParentBounds;
  }

  // We want to set the dom attributes ourselves to avoid triggering React's
  // diffing algorithm every draw
  updatePosition(position) {
    this.position = position;
    let domNode = React.findDOMNode(this);
    domNode.setAttribute('style', `transform: translate(${this.position.x}px, ${this.position.y}px)`);
  }

  componentWillReceiveProps(newProps) {
    this.position = newProps.position;
  }

  activate() {
    clearTimeout(this.dismissTimeout);
    this.setState({ visible: true });
  }


  // Dismisses the popup if the mouse is not in its bounds or its parent's
  // bounds.
  softDismiss() {
    clearTimeout(this.dismissTimeout);
    this.dismissTimeout = setTimeout( () => {
      if (!this.mouseInBounds && !this.mouseInParentBounts && !this.state.deletePending) {
        this.setState({ visible: false });
      }
    }, 100);
  }

  onMouseEnter(evt) {
    this.mouseInBounds = true;
  }

  onMouseLeave(evt) {
    this.mouseInBounds = false;
    this.softDismiss();
  }

  onResumeClicked(evt) {
    this.props.actions.resumeRecording(this.props.node.localId);
  }

  onDeleteClicked(evt) {
    this.setState({ deletePending: true });
    (this.props.onDeletePending || (() => {}))(evt);
  }

  onConfirmDeleteClicked(evt) {
    this.setState({ deletePending: false });
    (this.props.onDeleteConfirmed || (() => {}))(evt);
  }

  onCancelDeleteClicked(evt) {
    this.setState({ deletePending: false });
    (this.props.onDeleteCancelled || (() => {}))(evt);
  }

  render() {
    let content;
    let actions;
    let title = this.props.node.title || <i>No title</i>;

    if (this.state.visible) {
      let classNames = classnames('node-popover', {
        'delete-pending': this.state.deletePending
      });

      content = <div className={classNames}>
        <div className='content'>

          <h1>{this.isGoogleUrl(title, this.props.node.url)}</h1>

          <div className='detail'>
            <a className='url' target='_blank' href={this.props.node.url}>{ this.getTLD( this.props.node.url) }</a>
          </div>

        </div>
      </div>;
    }

    return <div
      onMouseEnter={this.onMouseEnter.bind(this)}
      onMouseLeave={this.onMouseLeave.bind(this)}>
      {content}
    </div>
  }

  isGoogleUrl(title, url){
      var res = url;
      if( url.indexOf("https://www.google") == 0 ){
          var qpos = url.indexOf("#q")
          if( qpos > -1 ) {
              res = url.slice(qpos, url.length);
              res = res.replace('#q=', '')
              res = res.replace(/\+/g, ' ')
              return res;
          }else{
              return title;
          }
      }else{
          return title;
      }
  }

  // Get TLD (Primary Domain)
  getTLD( url ) {
    let arr = url.split("/");
    let result = arr[2];
    return result;
  }

};
