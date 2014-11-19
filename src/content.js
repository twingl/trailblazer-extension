//main
var React = require('react/addons')
var Router = require('react-router');
var Route = Router.Route;
var Routes = require('react-router/modules/components/Routes');
var Redirect = Router.Redirect;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var domready = require('domready');

//components
var AssignmentList = require('app/components/assignment-list');
var MapView = require('app/components/map-view');

var actions = require('./actions.js');
var App = require('./content/app.js');

var Fluxxor = require('fluxxor');
var NodeStore = require('./stores/node-store');
var AssignmentStore = require('./stores/assignment-store');
var stores = {
  NodeStore: new NodeStore(),
  AssignmentStore: new AssignmentStore()
};
var flux = new Fluxxor.Flux(stores, actions);
//logging
flux.on("dispatch", function(type, payload) {
  if (console && console.log) {
    console.log("[Dispatch]", type, payload);
  }
});

//  window.addEventListener('popstate', function() {console.log('history', history)}, false);

// var routes = (
//   <Routes location="history">
//     <Route name='app' path="build/content.html" handler={App} flux={flux} >
//       <Route name="assignment-list" path="build/content.html/assignments" handler={AssignmentList} />
//       <Route name="map" path="build/content.html/map/:mapId" handler={MapView} />
//       <DefaultRoute handler={AssignmentList} />
//     </Route>
//   </Routes>
// )



React.render(<App flux={flux} />, document.body);

//example
// var routes = (
//   <Routes location="history">
//     <Route name='app' path="/" handler={App} flux={flux} >
//       <Route name="welcome" path="welcome" handler={Welcome} />
//       <Route name="assignment-list" path="assignments" handler={AssignmentList} />
      // <Route name="map-view" path="map" handler={MapView} >
      //   <Route name="map" path=":assignmentId" handler={Map} />
      // </Route>
//     </Route>
//   </Routes>
// )

