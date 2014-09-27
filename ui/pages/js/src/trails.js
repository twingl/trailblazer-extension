/** @jsx React.DOM */
var domready = require('domready');
var React = require('react');
var chrome = window.chrome;

//assignment list component with embedded list items
var AsssignmentList = React.createClass({
  render: function () {
    var assignments = this.props.items.map(function (assignment) {
      return <AsssignmentItem item={assignment} key={assignment.id} />;
    });

    return <ul>{assignments}</ul>;
  }
});

var AsssignmentItem = React.createClass({
  getInitialState: function () {
    return {
      show: true
    }
  },

  render: function () {
    var klass = this.state.show ? 'show' : 'destroy';

    return  <div className={klass} >
              <li
                key={this.props.item.id}
                onClick={this.handleClick} >
                {this.props.item.title}
                <a onClick={this.destroyAnimation}>
                  <img src="/ui/icons/delete-icon.svg" />
                </a>
              </li>
            </div>
  },

  componentDidMount: function () {
    this.getDOMNode().addEventListener('webkitTransitionEnd', this.destroy)
  },

  handleClick: function () {
    var id = this.props.item.id;
    chrome.runtime.sendMessage({action: 'getNodes', assignmentId: id});
    chrome.runtime.sendMessage({
      action: "trackUIEvent",
      eventName: "ui.trails.assignment.click",
      eventData: {
        assignmentId: this.props.item.id,
        userId:       this.props.item.user_id
      }
    });
    window.location.href  = "/ui/pages/map.html#assignment=" + id;
  },

  destroy: function () {
    var id = this.props.item.id;
    chrome.runtime.sendMessage({action: 'destroyAssignment', assignmentId: id});
  },

  destroyAnimation: function (evt) {
    if (window.confirm("Are you sure you want to delete " + this.props.item.title + "?")) {
      this.setState({show: false});
      evt.stopPropagation();

      chrome.runtime.sendMessage({
        action: "trackUIEvent",
        eventName: "ui.trails.assignment.delete.confirm",
        eventData: {
          assignmentId: this.props.item.id,
          userId:       this.props.item.user_id
        }
      });
    }
  }
});

// listen for updates to assignments and render in a list
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
  if (request.action === "updatedAssignments") {
    var assignments = request.updatedAssignments;

    if (assignments.length > 0) {
      React.renderComponent(
        <AsssignmentList items={assignments} />,
        document.getElementById('assignment-list')
      );
    };
  }
});

// send message to chrome to trigger assignment update
domready(function () {
  chrome.runtime.sendMessage({ action: 'getAssignments' });
});



