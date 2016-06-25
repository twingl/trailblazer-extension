import React from 'react';

import classnames from 'classnames';

const HALO = "M18.9063355 0.1 L33.942812 9 C34.6940305 9.5 35.3 10.5 35.3 11.4 L35.3030134 29.2 C35.3030134 30.1 34.7 31.2 33.9 31.6 L18.9063355 40.5 C18.1551171 40.9 16.9 40.9 16.2 40.5 L1.14945629 31.6 C0.39823781 31.2 -0.2 30.1 -0.2 29.2 L-0.21074509 11.4 C-0.21074509 10.5 0.4 9.5 1.1 9 L16.1859328 0.1 C16.9371513 -0.3 18.2 -0.3 18.9 0.1 Z";
const CORE = "M18.2007195 11.2 L24.9141649 15.1 C25.2495669 15.3 25.5 15.8 25.5 16.2 L25.5214639 24.2 C25.5214639 24.5 25.2 25 24.9 25.2 L18.2007195 29.2 C17.8653175 29.4 17.3 29.4 17 29.2 L10.272676 25.2 C9.93727401 25 9.7 24.5 9.7 24.2 L9.66537697 16.2 C9.66537697 15.8 9.9 15.3 10.3 15.1 L16.9861214 11.2 C17.3215234 11 17.9 11 18.2 11.2 Z";

const OFFSET_X = 17.5;
const OFFSET_Y = 21;

const WAYPOINT_THRESHOLD = 4; // # links until considered waypoint (includes link to parent)

const VIEWER_ENVIRONMENT = chrome.windows ? "extension" : "public";

export default class Node extends React.Component {

  constructor(props) {
    super(props);

    this.position = props.position;
  }

  // We want to set the dom attributes ourselves to avoid triggering React's
  // diffing algorithm every draw
  updatePosition(position) {
    this.position = position;
    let domNode = React.findDOMNode(this);
    domNode.setAttribute('transform', `translate(${this.position.x - OFFSET_X},${this.position.y - OFFSET_Y})`);
  }

  componentWillReceiveProps(newProps) {
    this.position = newProps.position;
  }

  getScreenPosition() {
    let domNode = React.findDOMNode(this.refs.center);
    let ctm = domNode.getScreenCTM();
    return {
      x: ctm.e,
      y: ctm.f
    }
  }

  setSidebarData( node ){

      var sidebar = document.getElementById('sidebar')
      sidebar.dataset.current_node_id = node.data.localId

      var title = sidebar.querySelector('.title')
      title.innerHTML = node.data.title

      var titleInput = document.getElementById('title-input')
      titleInput.value = node.data.title

      var url = sidebar.querySelector('.url')
      var domain = node.data.url.split('/');
      url.innerHTML = domain[0] + '//' + domain[1] + domain [2]

  }

  // trigger resume?-- trigger event callback on parent.
  onClick(evt) {
    (this.props.onClick || (() => {}))(evt);

        var sidebar = document.getElementById('sidebar')

        // Toggle sidebar
        if( sidebar.classList.contains('slidein') ){

            if( sidebar.dataset.current_node_id == this.props.node.data.localId ){
                sidebar.classList.remove('slidein')
                sidebar.classList.add('slideout')
            }else{
                this.setSidebarData( this.props.node )
            }

        }else{

            sidebar.classList.remove('slideout')
            sidebar.classList.add('slidein')
            this.setSidebarData( this.props.node )

        }

  }

  // trigger a popup-- trigger event callback on parent.
  onMouseEnter(evt) {
    (this.props.onMouseEnter || (() => {}))(evt);
  }

  onMouseLeave(evt) {
    (this.props.onMouseLeave || (() => {}))(evt);
  }

  render() {
    var classes = classnames('node', {
      'delete-pending': !!this.props.node.data.deletePending,
      hub: (this.props.node.links.length >= WAYPOINT_THRESHOLD),
      waypoint: (this.props.node.data.rank === 1),
      root: (!this.props.node.data.parentId && !this.props.node.data.localParentId),
      open: (!!this.props.node.data.tabId)
    });

    let href = (VIEWER_ENVIRONMENT === 'public') ? d.url : false;
    let target = (VIEWER_ENVIRONMENT === 'public') ? '_blank' : false;

    // We can't set xlink:href through React, so we need to do it manually.
    let imageContainer = <g dangerouslySetInnerHTML={{__html: `<image xlink:href='chrome://favicon/${this.props.node.data.url}' x="12.5" y="15.5" height="10" width="10" />`}}></g>;

    return <g
      onClick={this.onClick.bind(this)}
      onMouseEnter={this.onMouseEnter.bind(this)}
      onMouseLeave={this.onMouseLeave.bind(this)}
      className={classes}
      href={href}
      target={target}
      transform={`translate(${this.position.x - OFFSET_X},${this.position.y - OFFSET_Y})`}>
      <g ref='center' transform={`translate(${OFFSET_X}, ${OFFSET_Y})`}></g>
      <path d={HALO} className='node-halo' />
      <path d={CORE} className='node-core' />
      {imageContainer}
    </g>
  }
};
