import _     from 'lodash';
import React from 'react';

import Constants from '../../../constants';
import queries from '../../../queries';

import AssignmentItem from '../../assignment-item';

const OFFLINE_ASSIGNMENT_STYLE = {
  background: '#EEE',
  boxShadow: '0px 3px 3px rgba(32, 32, 32, 0.3)',
  borderRadius: '3px',
  padding: '12px',
  margin: '12px',
};

class Index extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      assignments: []
    };
  }

  getStateFromFlux(message) {
    if (message.action === Constants.__change__ && message.storeName === "AssignmentStore" && this.tempAssignmentHandler) {
      queries.AssignmentStore.getAssignments().then((assignments) => {
        this.setState({ assignments });
        this.tempAssignmentHandler(assignments);
      });
    }
  }

  componentDidMount() {
    console.log(this);
    queries.AssignmentStore.getAssignments().then( (assignments) => {
      this.setState({ assignments });
    });

    let _assignmentListener = (message) => {
      if (message.action === Constants.__change__ && message.storeName === "AssignmentStore") {
        queries.AssignmentStore.getAssignments().then( (assignments) => {
          this.setState({ assignments });
        });
      }
    };

    var __fluxHandler = this.getStateFromFlux.bind(this);

    this.setState({ __fluxHandler, _assignmentListener });

    chrome.runtime.onMessage.addListener(__fluxHandler);
    chrome.runtime.onMessage.addListener(_assignmentListener);
  }

  componentWillUnmount() {
    chrome.runtime.onMessage.removeListener(this.state.__fluxHandler);
    chrome.runtime.onMessage.removeListener(this.state._assignmentListener);
  }

  onFetchDataClicked(evt) {
    this.tempAssignmentHandler = (assignments) => {
      assignments.map(assignment => this.props.route.actions.fetchNodes(assignment.id));
    }

    this.props.route.actions.fetchAssignments();
  }

  onAssignmentClicked(assignment, evt) {
    console.log(assignment, evt);
  }

  importData(evt) {
    evt.preventDefault();

    let file = this.refs.file.files[0];

    let reader = new FileReader();

    reader.onload = (evt) => {
      if (reader.readyState === FileReader.DONE) {
        const contents = reader.result;

        const { assignments, nodes } = JSON.parse(contents);

        this.props.route.actions.importData({ assignments, nodes });
      }
    }

    reader.readAsText(file);
  }

  exportData(evt) {
    evt.preventDefault();

    Promise.all([
        queries.AssignmentStore.getAssignments(),
        queries.NodeStore.getNodes()
      ])
      .then(([assignments, nodes]) => {
        console.log({ assignments, nodes });

        const blob = new Blob([JSON.stringify({ assignments, nodes })]);

        const link = window.document.createElement("a");
        link.href = window.URL.createObjectURL(blob, { type: "text/plain" });
        link.download = "trails.trailblazerbackup";
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
      })
      .catch(console.error.bind(console));

  }


  render() {
    document.title = "Resume a Trail";

    var list = this.state.assignments.map((item) => {
      //return <AssignmentItem item={item} key={item.localId} actions={this.props.route.actions} />;
      return (
        <div className='show' key={item.id}>
          <li onClick={_ => this.context.router.push(`/assignments/${item.localId}`)}>
            {item.title}
          </li>
        </div>
      );
    });

    console.log(list);

    return (
      <div className="wrap assignment-index">
        <h1>Manage your data</h1>
        <div style={{
          border: "2px solid #AAA",
          borderRadius: "5px",
          margin: "20px",
          padding: "15px",
          textAlign: "left",
          background: "#EEE",
        }}>
          <h2>Download data from remote servers</h2>
          <p>
            This process will download fresh data from Trailblazer's servers,
            and may overwrite any conflicting data that exists locally
          </p>
          <p>
            <strong>
              Warning: this will fail after the shutdown date and may destroy
              data permanently. We recommend exporting existing data before
              performing this action.
            </strong>
          </p>
          <p><button onClick={this.onFetchDataClicked.bind(this)}>Download now</button></p>
        </div>

        <div style={{
          border: "2px solid #AAA",
          borderRadius: "5px",
          margin: "20px",
          padding: "15px",
          textAlign: "left",
          background: "#EEE",
        }}>
          <h2>Import a trailblazer backup</h2>
          <p>Load a copy of the data you've previously exported from Trailblazer</p>
          <p>
            <strong>
              Warning: this will delete any existing data in your extension
              before loading the backup.
            </strong>
          </p>
          <p>
            <form onSubmit={this.importData.bind(this)}>
              <input type="file" name="file" ref="file" accept=".trailblazerbackup" />
              <button>Import</button>
              </form>
            </p>
        </div>

        <div style={{
          border: "2px solid #AAA",
          borderRadius: "5px",
          margin: "20px",
          padding: "15px",
          textAlign: "left",
          background: "#EEE",
        }}>
          <h2>Your restored trails</h2>
          <p>
            These are the trails that are currently loaded in Trailblazer. You
            can continue to view them, however resuming and recording may not
            work as expected.
          </p>
          <p>
            You may export these to make a backup of this data using the button
            below.
          </p>

          <p>
            <button onClick={this.exportData.bind(this)}>Export this data</button>
          </p>
        </div>

        <h1>Trails</h1>

        {(list.length > 0) ? (
          <ul className="assignment-menu">{list}</ul>
        ) : (
          <p>
            Oops, there's nothing here yet.
          </p>
        )}
      </div>
    );
  }

};

Index.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default Index;
