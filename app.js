/**
 * Module dependencies.
 */
var prismic = require('prismic-nodejs');
var app = require('./config');
var configuration = require('./prismic-configuration');
var PORT = app.get('port');

// Returns a Promise
function api(req, res) {
  // So we can use this information in the views
  res.locals.ctx = {
    endpoint: configuration.apiEndpoint,
    linkResolver: configuration.linkResolver
  };
  return prismic.api(configuration.apiEndpoint, {
    accessToken: configuration.accessToken,
    req: req
  });
}

function handleError(err, req, res) {
  if (err.status == 404) {
    res.status(404).send("404 not found");
  } else {
    res.status(500).send("Error 500: " + err.message);
  }
}

app.listen(PORT, function() {
  console.log('Express server listening on port ' + PORT);
});

app.route('/preview').get(function(req, res) {
  api(req, res).then(function(api) {
    return prismic.preview(api, configuration.linkResolver, req, res);
  }).catch(function(err) {
    handleError(err, req, res);
  });
});

app.route('/:uid').get(function(req, res) {
  var uid = req.params.uid;
  api(req, res).then(function(api) {
    return api.getByUID("article", uid);
  }).then(function(pageContent) {
    if (pageContent === undefined) {
      res.render('no-results');
    } else {
      res.render('index', {
        pageContent: pageContent
      });
    }
  });
});

app.route('/').get(function(req, res){
  api(req, res).then(function(api) {
    return api.query(prismic.Predicates.at("document.type", "article"));
  }).then(function(pageContent) {
    if (pageContent.results_size == 0) {
      res.render('no-results');
    } else {
      return res.redirect("/"+pageContent.results[0].uid);
    }
  });
});



