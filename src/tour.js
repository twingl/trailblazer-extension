var scripts = document.getElementsByTagName('script');

for (var i = 0; i < scripts.length; i += 1) {
  var queryString = scripts[i].src.replace(/^[^\?]+\??/,'');

  if (queryString.match(/sign-in/)) { require('./tour/sign-in') };
  if (queryString.match(/1/)) { require('./tour/1') };
  if (queryString.match(/2/)) { require('./tour/2') };
  if (queryString.match(/3/)) { require('./tour/3') };
  if (queryString.match(/4/)) { require('./tour/4') };
  if (queryString.match(/5/)) { require('./tour/5') };
  if (queryString.match(/6/)) { require('./tour/6') };
  if (queryString.match(/7/)) { require('./tour/7') };
};

require('./content-scripts/page-title');
