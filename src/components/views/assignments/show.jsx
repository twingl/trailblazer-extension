import React from 'react';
import _ from 'lodash';

import queries from '../../../queries';
import Constants from '../../../constants';

import MapView from '../../map-view';

import Logger from '../../../util/logger';
var logger = Logger('assignments-show');


/**
 * The Assignments Show view.
 *
 * Shows a single Assignment, rendering it as a MapView
 */
export default class Show extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      localAssignmentId: parseInt(props.params.id),
      assignment: undefined,
      nodes: []
    };
  }

  componentWillReceiveProps(newProps) {
    if (this.state.localAssignmentId !== newProps.params.id) {
      this.setState({ localAssignmentId: parseInt(newProps.params.id) });

      queries.AssignmentStore.getAssignmentByLocalId(this.state.localAssignmentId)
        .then(assignment => this.setState({ assignment }));

      queries.NodeStore.getNodesByLocalAssignmentId(this.state.localAssignmentId)
        .then(nodes => this.setState({ nodes }));
    }
  }

  getStateFromFlux(message) {
    if (message.action === Constants.__change__ && message.storeName === "AssignmentStore") {
      console.log("setting state: assignment", this.state.localAssignmentId);
      queries.AssignmentStore.getAssignmentByLocalId(this.state.localAssignmentId)
        .then(assignment => this.setState({ assignment }));
    }

    if (message.action === Constants.__change__ && message.storeName === "NodeStore") {
      console.log("setting state: nodes", this.state.localAssignmentId);
      queries.NodeStore.getNodesByLocalAssignmentId(this.state.localAssignmentId)
        .then(nodes => this.setState({ nodes }));
    }
  }

  componentDidMount() {
    console.log(this);
    queries.AssignmentStore.getAssignmentByLocalId(this.state.localAssignmentId)
      .then(assignment => this.setState({ assignment }));

    queries.NodeStore.getNodesByLocalAssignmentId(this.state.localAssignmentId)
      .then(nodes => this.setState({ nodes }));

    var __fluxHandler = this.getStateFromFlux.bind(this);

    chrome.runtime.onMessage.addListener(__fluxHandler);

    this.setState({ __fluxHandler });

    this.props.route.actions.viewedMap(this.state.localAssignmentId);
    this.props.route.actions.requestNodes(this.state.localAssignmentId);
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
        actions={this.props.route.actions} />;
    } else {
      el = <span>Loading</span>;
    }

    return <div className="wrap assignment-show">{el}</div>;
  }

};

Show.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default Show;
