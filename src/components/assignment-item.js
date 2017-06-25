import React from 'react';
import ReactDOM from 'react-dom';

class AssignmentItem extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      show: true
    };

    this.onClick = this.onClick.bind(this);
  }

  render() {
    var klass = this.state.show ? 'show' : 'destroy';

                //TODO change path
    return  <div className={klass}  onClick={this.onClick}>
              <li key={this.props.item.id}>

                {this.props.item.title}

                <a onClick={this.onClickDestroy.bind(this)}>
                  <img src="/assets/icons/delete-icon.svg" />
                </a>
              </li>
            </div>;
  }

  componentDidMount() {
    ReactDOM.getDOMNode(this).addEventListener('webkitTransitionEnd', this.destroy)
  }

  onClick() {
    console.log(this.props.item.localId);
    this.context.router.push(`/assignments/${this.props.item.localId}`);
  }

  onClickDestroy(evt) {
    evt.stopPropagation();

    var confirmation = window.confirm("Are you sure you want to delete " + this.props.item.title + "?");

    if (confirmation) {
      this.setState({show: false});
      this.props.actions.destroyAssignment(this.props.item.localId);
    }
  }

};

AssignmentItem.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default AssignmentItem;
