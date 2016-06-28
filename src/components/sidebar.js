import React from 'react';
import { Link } from 'react-router';
import _ from 'lodash';

import Constants from '../constants';

////components
//import AssignmentTitle from './assignment-title';
//import ShareMap from './share-map';
//import Legend from './legend';
//import Trail from './trail';
//
//import Logger from '../util/logger';
//var logger = Logger('map-view');

export default class Sidebar extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      sharePopoverState: false
    };
  }

  render() {
//    var nodeObj = {};
//    this.props.nodes.map(node => nodeObj[node.localId] = node);
//
//    var visible, shareText, title, url;
//
//    visible       = this.props.assignment.visible; //state
//    shareText     = (visible) ? "Shared" : "Share"; //state
//    title         = this.props.assignment.title;
//    url           = this.props.assignment.url;
//
//    //nodes are immutable
//    var data = {
//      nodeObj: nodeObj,
//      assignment: this.props.assignment
//    };

    return <div className="sidebar" id="sidebar">
            <div className="close" onClick={this.close}>
                <span className="btn">close</span>
            </div>
            <div className="title-wrap">
                <span id="title" className="title"></span>
                <input id="title-input" className="hide" type="text" defaultValue="..." />
                <span id="edit-title" onClick={this.editTitle} className="btn">edit</span>
            </div>
            <div className="url"></div>
            <div className="intro"></div>
            <div className="voting">
                <span className="up">Up</span><span className="neutral">Neutral</span><span className="down">Down</span>
            </div>
        </div>
  }

  close() {
    var sidebar = document.getElementById('sidebar')
    sidebar.classList.remove('slidein')
    sidebar.classList.add('slideout')
  }

  editTitle(){
    var title = document.getElementById('title')
    var titleInput = document.getElementById('title-input')

    title.classList.toggle('hide')
    titleInput.classList.toggle('hide')

  }

};
