(function($) {
  //assignment list component with embedded list items
  var AsssignmentList = React.createClass({
    render: function () {
      var createItem = function(item) {
        return React.DOM.li(null, item.title);
      };

      return React.DOM.ul(null, this.props.items.map(createItem));
    }
  });

  // listen for updates to assignments and render in a list 
  chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    var assignments = request.updatedAssignments;

    if (assignments.length > 0) {
      React.renderComponent(
        AsssignmentList({items: assignments}), 
        document.getElementById('assignment-list')
      );
    };
  });

  // send message to chrome to trigger assignment update
  $(window).on('load', function () {
    chrome.runtime.sendMessage({ action: 'getAssignments' });
  });
}(window.jQuery));