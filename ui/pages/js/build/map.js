(function() {
  'use strict';

  var nodeCoreD = "M18.9063355 0.1 L33.942812 9 C34.6940305 9.5 35.3 10.5 35.3 11.4 L35.3030134 29.2 C35.3030134 30.1 34.7 31.2 33.9 31.6 L18.9063355 40.5 C18.1551171 40.9 16.9 40.9 16.2 40.5 L1.14945629 31.6 C0.39823781 31.2 -0.2 30.1 -0.2 29.2 L-0.21074509 11.4 C-0.21074509 10.5 0.4 9.5 1.1 9 L16.1859328 0.1 C16.9371513 -0.3 18.2 -0.3 18.9 0.1 Z",
      nodeHaloD = "M18.2007195 11.2 L24.9141649 15.1 C25.2495669 15.3 25.5 15.8 25.5 16.2 L25.5214639 24.2 C25.5214639 24.5 25.2 25 24.9 25.2 L18.2007195 29.2 C17.8653175 29.4 17.3 29.4 17 29.2 L10.272676 25.2 C9.93727401 25 9.7 24.5 9.7 24.2 L9.66537697 16.2 C9.66537697 15.8 9.9 15.3 10.3 15.1 L16.9861214 11.2 C17.3215234 11 17.9 11 18.2 11.2 Z",
      //hack to account for offset [0,0] coordinates of generated inline svg
      offsetX = -18,
      offsetY = -21;
  /**
   *  Render cleaned data
   */
  // Convert our data structure into one that d3 can render
  var d3ify = function(data) {
    // Initialize the final containers that will be given to D3 to render
    var links = [];
    var nodes = [];

    // We need to convert our trees into a list of nodes and links.
    // Keep track of the index so that we can associate the array of nodes/links
    // with their respective locations in the original object
    var index = 0;
    var idMap = {};

    // Iterate over nodes to insert them into an array with known indices
    _.each(data.nodes, function(node, nodeId) {
      // Record the relationship between index and location in the original
      // object
      idMap[node.id] = {
        index: index++,
        treeId: node.treeId,
        nodeId: node.id
      };

      // Add the node to the rendering list of nodes
      nodes.push(node);
    });

    // Iterate over the nodes a second time to create links
    _.each(data.nodes, function(node, nodeId) {
      // Add a link to the rendering list if there's a relationship present.
      // Note the directionality: parentNode -> node
      if (node.parentId && idMap[node.parentId]) {
        links.push({
          source: idMap[node.parentId].index,
          target: idMap[node.id].index
        });
      }
    });

    return {
      nodes: nodes,
      links: links
    };
  };

  var syntaxHighlight = function(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  };

  // Rendering function - takes the format returned by d3ify(), i.e.
  // render("selector", {nodes: nodes[], links: links[] })
  var render = function(selector, data) {
    var tip = d3.tip()
      .direction("e")
      .offset([0, 10])
      .attr("class", "d3-tip")
      .html(function(d) {
        return "<pre>" + syntaxHighlight(JSON.stringify({title: d.title, url: d.url}, null, 3)) + "</pre>";
      });

    var width = 960,
        height = 500;

    var force = d3.layout.force()
      .linkDistance(80)
      .charge(-300)
      .size([width, height]);

    var svg = d3.select(selector).append("svg")
          .attr("width", "100%")
          .attr("height", "100%")
          .attr("viewBox", "0 0 " + width + " " + height )
          .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
          .call(d3.behavior.zoom().scaleExtent([.5, 4]).on("zoom", zoom))
        .append("g");

/* This may do nothing - May influence the zooming function (labrador at chemistry set.jpg) */
    svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height);
/* This may do nothing - May influence the zooming function */

    function zoom() {
      svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    force.nodes(data.nodes).links(data.links).start();

    var link = svg.selectAll(".link")
          .data(data.links)
          .enter()
            .append("line")
              .attr("class", "link");
    
    var gnodes = svg.selectAll(".node")
          .data(data.nodes)
          .enter()
          .append('g')
          .attr('class', function(d) { return d.tabId ? 'open node' : 'closed node' });

    var nodeHalos = gnodes.append('path')
                    .attr('d', nodeHaloD)
                    .attr("class", "node-core");

    var nodes = gnodes.append('path')
                  .attr('d', nodeCoreD)
                  .attr("class", "node-halo");

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      gnodes.attr("transform", function(d) { return "translate(" +(d.x+offsetX)+ "," +(d.y+offsetY)+ ")"; })

    });

    svg.call(tip);
    svg.selectAll(".node")
      .data(data.nodes)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    // Register the click handler for the nodes
    svg.selectAll(".node")
      .on('click', function(node) {
        // If a link is middle clicked or ctrl/cmd+clicked
        if (d3.event.which === 2 || (d3.event.which === 1 && (d3.event.metaKey || d3.event.ctrlKey))) {
          d3.event.preventDefault();
          d3.event.stopPropagation();
 
          // Tell the runtime to open a new tab
          chrome.runtime.sendMessage({
            action: 'resumeAssignment',
            nodeId: node.id
          });
        }
      });
  };

  var assignmentId;

  if (window.location.hash) {
    var o = {};
    _.each(window.location.hash.substring(1).split('&'), function(i) {
      var kv = i.split('=');
      o[kv[0]] = kv[1];
    });
    assignmentId = parseInt(o.assignment);
  };

  var getMap =  function(assignmentId) {
    chrome.runtime.sendMessage({ action: "getMap", assignmentId: assignmentId }, function(response) {
        if (response.data && response.data.nodes && Object.keys(response.data.nodes).length > 0) {
          render("#map", d3ify( response.data ));
        };
      });
  };

  //listen for updates to an assignment's nodes and render map
  chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.action === "updatedNodes" && request.assignmentId === assignmentId) {
      getMap(assignmentId);
    };
  });

  getMap(assignmentId);
}());
