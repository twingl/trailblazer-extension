module.exports = function (d) {
  //HACK using class rather than d.tabId as the latter is inconsistent
  var isOpen = d3.select(this.parentNode).classed('open');
  var html = "<p>" + d.title + "</p><p class='tooltip-url'>" + d.url + "</p><p class='temp-help'>";

  if (isOpen) {
    html += "This page is open - tap to switch to it</p>"
  } else {
    html += "Tap to open in a new tab and activate Trailblazer</p>";
  }
  return html;
}
