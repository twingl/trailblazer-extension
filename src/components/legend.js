var React = require('react')
  , _     = require('lodash');

var nodeHaloD = "M18.9063355 0.1 L33.942812 9 C34.6940305 9.5 35.3 10.5 35.3 11.4 L35.3030134 29.2 C35.3030134 30.1 34.7 31.2 33.9 31.6 L18.9063355 40.5 C18.1551171 40.9 16.9 40.9 16.2 40.5 L1.14945629 31.6 C0.39823781 31.2 -0.2 30.1 -0.2 29.2 L-0.21074509 11.4 C-0.21074509 10.5 0.4 9.5 1.1 9 L16.1859328 0.1 C16.9371513 -0.3 18.2 -0.3 18.9 0.1 Z"
  , nodeCoreD = "M18.2007195 11.2 L24.9141649 15.1 C25.2495669 15.3 25.5 15.8 25.5 16.2 L25.5214639 24.2 C25.5214639 24.5 25.2 25 24.9 25.2 L18.2007195 29.2 C17.8653175 29.4 17.3 29.4 17 29.2 L10.272676 25.2 C9.93727401 25 9.7 24.5 9.7 24.2 L9.66537697 16.2 C9.66537697 15.8 9.9 15.3 10.3 15.1 L16.9861214 11.2 C17.3215234 11 17.9 11 18.2 11.2 Z";

var iconWidth = "29"
  , iconHeight = "32"
  , iconTransform = "translate(2,2)scale(0.7)"

module.exports = React.createClass({
  render: function () {
    var active;
    if (!_.contains(this.props.hide, "active")) {
      active = <li className="active-node">
        <svg width={iconWidth} height={iconHeight}>
          <g className="node open" transform={iconTransform}>
            <path d={nodeHaloD} className="node-halo" />
            <path d={nodeCoreD} className="node-core" />
          </g>
        </svg>
        Trailblazer is active on this page
      </li>;
    }

    return <div className="legend">
      <ul>
        <li className="regular-node">
          <svg width={iconWidth} height={iconHeight}>
            <g className="node" transform={iconTransform}>
              <path d={nodeHaloD} className="node-halo" />
              <path d={nodeCoreD} className="node-core" />
            </g>
          </svg>
          A regular page
        </li>

        <li className="root-node">
          <svg width={iconWidth} height={iconHeight}>
            <g className="node root" transform={iconTransform}>
              <path d={nodeHaloD} className="node-halo" />
              <path d={nodeCoreD} className="node-core" />
            </g>
          </svg>
          The first page in the trail
        </li>

        { active }

        <li className="hub-node">
          <svg width={iconWidth} height={iconHeight}>
            <g className="node hub" transform={iconTransform}>
              <path d={nodeHaloD} className="node-halo" />
              <path d={nodeCoreD} className="node-core" />
            </g>
          </svg>
          This page split off into many directions
        </li>

        <li className="waypoint-node">
          <svg width={iconWidth} height={iconHeight}>
            <g className="node waypoint" transform={iconTransform}>
              <path d={nodeHaloD} className="node-halo" />
              <path d={nodeCoreD} className="node-core" />
            </g>
          </svg>
          This page is important (a waypoint)
        </li>
      </ul>
    </div>;
  }
});
