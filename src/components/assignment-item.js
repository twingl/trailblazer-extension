import React from 'react';
var navigate = require('react-mini-router').navigate;


export default class AssignmentItem extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      show: true
    };
  }

  render() {
    var klass = this.state.show ? 'show' : 'destroy';

                //TODO change path
    return  <div className={klass} >
              <li key={this.props.item.id} onClick={this.onClick.bind(this)}>

                {this.props.item.title}

                <a onClick={this.onClickDestroy.bind(this)}>
                  <img src="/assets/icons/delete-icon.svg" />
                </a>
              </li>
            </div>;
  }

  componentDidMount() {
    this.getDOMNode().addEventListener('webkitTransitionEnd', this.destroy)
  }

  onClick() {
    var id = this.props.item.localId;
    navigate('/assignments/' + id);
  }

  onClickDestroy(evt) {
    evt.stopPropagation();

    var confirmation = window.confirm("Are you sure you want to delete " + this.props.item.title + "?");

    if (confirmation) {
      if (this.isMounted()) this.setState({show: false});
      this.props.actions.destroyAssignment(this.props.item.localId);
    }
  }

};
