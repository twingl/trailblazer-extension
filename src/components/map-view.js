import React from 'react';
import _ from 'lodash';

//components
import AssignmentTitle from './assignment-title';
import ShareMap from './share-map';
import Legend from './legend';

import Logger from '../util/logger';
var logger = Logger('map-view');

import Trail from './trail';

// var state = {
//       nodeState: {
//         loading: false,
//         error: null,
//         nodeIndex: {}
//       },
//       assignmentState: {
//         loading: false,
//         error: null,
//         assignmentsIndex: {},
//         currentAssignment: null
//       }
// };


export default class MapView extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      sharePopoverState: false
    };
  }

  render() {
    var nodeObj = {};
    _.each(this.props.nodes, function (node) {
      nodeObj[node.localId] = node;
    });

    var visible, shareText, title, url;

    visible       = this.props.assignment.visible; //state
    shareText     = (visible) ? "Shared" : "Share"; //state
    title         = this.props.assignment.title;
    url           = this.props.assignment.url;

    //nodes are immutable
    var data = {
      nodeObj: nodeObj,
      assignment: this.props.assignment
    };

    return  <div className="map-view-wrapper" onClick={this.handleClick.bind(this)}>
              <a href="#!/assignments" className="nav-assignment-list"></a>
              <AssignmentTitle assignment={this.props.assignment} actions={this.props.actions} constants={this.props.constants} />
              <Trail id="map-container" svgId="map" assignment={this.props.assignment} nodes={this.props.nodes} actions={this.props.actions} />
              <Legend />
              <span className="help">
                <a
                  className="feedback"
                  href="mailto:hello@trailblazer.io?subject=Trailblazer In-App Feedback"
                  title="Problem? Let us know."
                  target="_blank">
                  Feedback |
                </a>
                <a
                  className="tutorial"
                  href="/build/tour/sign-in.html"
                  title="How do I use Trailblazer?"
                  target="_blank" >
                  <img src="/assets/icons/tutorial-icon-light.svg" />
                </a>
                <ShareMap
                  localAssignmentId={this.props.assignment.localId}
                  visible={visible}
                  mapURL={url}
                  popover={this.state.sharePopoverState}
                  actions={this.props.actions}
                  togglePopover={this.togglePopover.bind(this)} />
              </span>
            </div>;
  }

  handleClick(evt) {
    //remove popover when clicking anywhere else
    if (this.state.sharePopoverState &&
        !document.getElementById('share-popover').contains(evt.target)) {
      this.setState({sharePopoverState: false});
    };
  }

  togglePopover() {
    var bool = !this.state.sharePopoverState;
    this.setState({sharePopoverState: bool});
  }
};
