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

  render(){

    var title   = '';
    var url     = '';
    var classes = (this.props.node === null) ? 'sidebar' : 'sidebar slideout';

    if( this.props.node ){
        title   = this.props.node.props.node.data.title;
        url     = this.props.node.props.node.data.url;
        classes = 'sidebar slidein';
    }

    return <div className={classes} id="sidebar">
            <div className="close" onClick={this.close}>
                <span className="btn">close</span>
            </div>
            <div className="title-wrap">
                <span id="title" className="title">{title}</span>
                <input id="title-input" className="hide" type="text" defaultValue={title} />
                <span id="edit-title" onClick={this.editTitle} className="btn">edit</span>
            </div>
            <div className="url">{url}</div>
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
