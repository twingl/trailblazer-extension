import React from 'react';

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
      if (!this.mouseInBounds && !this.mouseInParentBounts) {
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

  render() {
    var content;
    if (this.state.visible) {
      let title = this.props.node.title || <i>No title</i>;

      content = <div className='node-popover'>
        <div className='content'>

          <h1>{title}</h1>

          <div className='detail'>
            <a className='url' target='_blank' href={this.props.node.url}>{this.props.node.url}</a>
          </div>

          <div className='actions'>
            <div className='secondary'></div>
            <div className='primary'>
              <button onClick={this.onResumeClicked.bind(this)} className='resume'>Resume</button>
            </div>
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
};
