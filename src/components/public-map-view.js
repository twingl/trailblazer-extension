var React = require('react');

//components
var PublicMapTitle = require('./public-map-title');
var Map = require('./map');
var ShareMap = require('./share-map');
var Legend = require('./legend');

module.exports = React.createClass({
  render: function () {
    console.log('mapview rendering')
    var nodeObj = {};
    _.each(this.props.nodes, function (node) {
      nodeObj[node.localId] = node;
    });

    var visible, shareText, title, url;

    visible       = this.props.assignment.visible; //state
    shareText     = (visible) ? "Shared" : "Share"; //state
    title         = this.props.assignment.title;
    url           = this.props.assignment.url;

    //nodes are immutable
    var data = {
      nodeObj: nodeObj,
      assignment: this.props.assignment
    };

    return  <div className="map-view-wrapper public">
              <PublicMapTitle title={this.props.assignment.title} />
              <div id="map-container" >
                <Map id="map" width={960} height={500} selector="#map" data={data} />
              </div>
              <Legend hide={ ["active"] } />
            </div>;
  }

});
