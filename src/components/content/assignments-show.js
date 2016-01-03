import React from 'react';
import MapView from '../map-view';
import _ from 'lodash';

import queries from '../../queries';
import constants from '../../constants';

import Logger from '../../util/logger';
var logger = Logger('assignments-show');


/**
 * The Assignments Show view.
 *
 * Shows a single Assignment, rendering it as a MapView
 */
export default class AssignmentsShow extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      assignment: undefined,
      nodes: []
    };
  }

  componentWillReceiveProps(newProps) {
    if (this.props.localId !== newProps.localId) {
      queries.AssignmentStore.getAssignmentByLocalId(newProps.localId)
        .then(assignment => this.setState({ assignment }));

      queries.NodeStore.getNodesByLocalAssignmentId(newProps.localId)
        .then(nodes => this.setState({ nodes }));
    }
  }

  getStateFromFlux(message) {
    if (message.action === constants.__change__ && message.storeName === "AssignmentStore") {
      console.log("setting state: assignment", this.props.localId);
      queries.AssignmentStore.getAssignmentByLocalId(this.props.localId)
        .then(assignment => this.setState({ assignment }));
    }

    if (message.action === constants.__change__ && message.storeName === "NodeStore") {
      console.log("setting state: nodes", this.props.localId);
      queries.NodeStore.getNodesByLocalAssignmentId(this.props.localId)
        .then(nodes => this.setState({ nodes }));
    }
  }

  componentDidMount() {
    queries.AssignmentStore.getAssignmentByLocalId(this.props.localId)
      .then(assignment => this.setState({ assignment }));

    queries.NodeStore.getNodesByLocalAssignmentId(this.props.localId)
      .then(nodes => this.setState({ nodes }));

    var __fluxHandler = this.getStateFromFlux.bind(this);

    chrome.runtime.onMessage.addListener(__fluxHandler);

    this.setState({ __fluxHandler });

    this.props.actions.viewedMap(this.props.localId);
    this.props.actions.requestNodes(this.props.localId);
  }

  componentWillUnmount() {
    chrome.runtime.onMessage.removeListener(this.state.__fluxHandler);
  }

  render() {
    var el;
    if (this.state.assignment) {
      document.title = this.state.assignment.title;
    }

    if (this.state.assignment && this.state.nodes) {
      el = <MapView
        assignment={this.state.assignment}
        nodes={this.state.nodes}
        actions={this.props.actions}
        constants={this.props.constants} />;
    } else {
      el = <span>Loading</span>;
    }

    return <div className="wrap assignment-show">{el}</div>
  }

};


