import React from 'react';
import _ from 'lodash';

import createGraph from 'ngraph.graph';
import createLayout from 'ngraph.forcelayout';
import svgPanZoom from 'svg-pan-zoom';

import Node from "./node";
import NodePopover from "./node-popover";
import Link from "./link";

import Logger from '../util/logger';
var logger = new Logger('trail.js');

export default class Trail extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      graph: createGraph(),
      nodesPendingDeletion: []
    };
  }

  componentWillMount() {
    // Prepare the initial graph data
    this.props.nodes.map(n => this.state.graph.addNode(n.localId, n));
    this.props.nodes.map((n) => {
      if (n.localParentId) {
        this.state.graph.addLink(n.localParentId, n.localId, { deletePending: false });
      }
    });

    let layout = createLayout(this.state.graph, {
      springLength: 60
    });

    this.props.nodes.map(n => layout.setNodePosition(n.localId, n.x, n.y));

    this.setState({ layout });
  }

  componentDidMount() {
    let updatePopovers = () => {
      let fn = () => {
        this.updateNodePositions();
      };

      setTimeout(fn, 30);
      let debouncedFn = _.debounce(fn, 75);
    };

    this.svgPanZoom = svgPanZoom( React.findDOMNode(this.refs.svg), {
      viewportSelector: '.viewport',
      fit: true,
      center: true,
      zoomEnabled: true,
      maxZoom: 2.5,
      zoomScaleSensitivity: 0.3,
      onPan: updatePopovers,
      onZoom: updatePopovers
    });
  }

  componentWillUnmount() {
    this.disposed = true;
    this.svgPanZoom.destroy();
    this.state.layout.dispose();
  }

  componentDidUpdate() {
    let changed = false;

    this.state.graph.forEachNode((node) => {
      if (!_.find(this.props.nodes, { localId: node.id})) {
        this.state.graph.removeNode(node.id);
        changed = true;
      }
    });

    this.props.nodes.map((n) => {
      // Trigger an update if a new node is added
      if (!this.state.graph.getNode(n.localId)) changed = true;

      // Update any existing nodes with data changes if needed
      this.state.graph.addNode(n.localId, n);
      if (n.x && n.y) this.state.layout.setNodePosition(n.localId, n.x, n.y);
    });

    this.props.nodes.map((n) => {
      // Add in any links that are missing after the node updates, triggering a
      // change if needed
      if (n.localParentId && !this.state.graph.hasLink(n.localParentId, n.localId)) {
        this.state.graph.addLink(n.localParentId, n.localId, { deletePending: false });
        changed = true;
      }
    });

    if (changed) this.setState({ stable: false });
    this.animationLoop();
  }

  updateNodePositions() {
    this.state.graph.forEachNode((n) => {
      let reactNode = this.refs[`node-${n.id}`];

      if (reactNode) {
        let position = this.state.layout.getNodePosition(n.id);
        if (position) reactNode.updatePosition(position);

        let popover = this.refs[`node-popover-${n.id}`];
        let screenPosition = reactNode.getScreenPosition();
        if (popover && screenPosition) popover.updatePosition(screenPosition);
      }
    });
  }

  updateLinkPositions() {
    this.state.graph.forEachLink((l) => {
      let reactNode = this.refs[`link-${l.id}`];

      if (reactNode) {
        let position = this.state.layout.getLinkPosition(l.id);
        if (position) reactNode.updatePosition(position);
      }
    });
  }

  onGraphStabilityReached() {
    let coords = {};
    this.state.graph.forEachNode((node) => {
      let position = this.state.layout.getNodePosition(node.id);
      coords[node.data.localId] = { x: position.x, y: position.y };
    });
    this.props.actions.saveMapLayout(this.props.assignment.localId, coords);
  }

  animationLoop() {
    if (this.disposed || this.state.stable) return;
    requestAnimationFrame(this.animationLoop.bind(this));

    if (this.state.layout && this.props.nodes.length > 0 && !this.state.stable) {
      let stable = this.state.layout.step();

      if (stable !== this.state.stable) {
        if (stable) this.onGraphStabilityReached();
        this.setState({ stable });
      }
    }

    this.updateNodePositions();
    this.updateLinkPositions();
  }

  // This is sharing state between react components which is dicey at
  // best, but until we can get a better interaction model between SVG and DOM
  // hover events (i.e. not using this div anchor business) this is about as
  // best it can be.
  // Moving the trail rendering implementation and this popover to canvas might
  // solve a lot of these problems if we can handle everything in one
  // environment.
  activatePopover(node, evt = null) {
    let popover = this.refs[`node-popover-${node.id}`];
    popover.mouseInParentBounds = true;
    popover.activate();
  }

  softDismissPopover(node, evt = null) {
    let popover = this.refs[`node-popover-${node.id}`];
    popover.mouseInParentBounds = false;
    popover.softDismiss();
  }

  onDeletePending(node, evt = null) {
    let fn = (nodeIds, processedIds) => {

      let nextIds = _.flatten( _.without(nodeIds, ...processedIds).map((id) => {
        let node = this.state.graph.getNode(id);
        node.data.deletePending = true;
        this.state.graph.addNode(node.id, node.data);

        processedIds.push(node.id);

        // Next set of IDs to process
        return node.links.map((l) => {
          if (l.toId !== node.id) {
            l.data.deletePending = true;
          }
          return l.toId;
        });
      }));

      if (nextIds.length > 0) {
        fn(nextIds, processedIds);
      } else {
        this.setState({ nodesPendingDeletion: processedIds })
      }
    };

    fn([node.id], []);

    this.setState({ changed: true });
  }

  onDeleteConfirmed(node, evt = null) {
    this.props.actions.bulkDestroyNodes(this.state.nodesPendingDeletion);
    this.setState({ nodesPendingDeletion: [] });
  }

  onDeleteCancelled(node, evt = null) {
    this.state.graph.forEachNode((node) => {
      delete node.data.deletePending;
      node.links.map(l => l.data.deletePending = false);
      this.state.graph.addNode(node.id, node.data);
    });
    this.setState({ changed: true, nodesPendingDeletion: [] });
  }

  render() {
    let nodes = [];
    let popovers = [];
    let links = [];

    this.state.graph.forEachNode((n) => {
      var position = this.state.layout.getNodePosition(n.id);
      let key = `node-${n.id}`;
      let popoverKey = `node-popover-${n.id}`;

      popovers.push(
          <NodePopover
            key={popoverKey}
            ref={popoverKey}
            node={n.data}
            position={position}
            onDeletePending={this.onDeletePending.bind(this, n)}
            onDeleteConfirmed={this.onDeleteConfirmed.bind(this, n)}
            onDeleteCancelled={this.onDeleteCancelled.bind(this, n)}
            actions={this.props.actions}
      />);

      nodes.push(
          <Node key={key}
            ref={key}
            node={n}
            position={position}
            actions={this.props.actions}
            onMouseEnter={this.activatePopover.bind(this, n)}
            onMouseLeave={this.softDismissPopover.bind(this, n)}
      />);
    });

    this.state.graph.forEachLink((l) => {
      let position = this.state.layout.getLinkPosition(l.id);
      let key = `link-${l.id}`;

      links.push(<Link key={key} ref={key} link={l} position={position} actions={this.props.actions} />);
    });

    return <div id={this.props.id}>
      <div className='popovers'>{popovers}</div>
      <svg
        ref='svg'
        width='100%'
        height='100%'
        viewBox='-480 -250 960 500'
        preserveAspectRatio='xMidYMid meet'
        xmlns='http://www.w3.org/2000/svg'>
        <g className='viewport'>
          {links}
          {nodes}
        </g>
      </svg>
    </div>;
  }
};
