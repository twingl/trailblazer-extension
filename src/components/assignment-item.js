import React from 'react';

class AssignmentItem extends React.Component {

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
    this.context.router.push(`/assignments/${this.props.item.localId}`);
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

AssignmentItem.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default AssignmentItem;
