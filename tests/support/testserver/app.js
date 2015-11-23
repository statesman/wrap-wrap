var express = require('express'),
    app = express(),
    path = require('path'),
    glob = require('glob');

// Serve scraped wrap files
app.use(express.static('dist'));
// Serve screenshots output by functional tests
app.use(express.static('tests/screenshots'));

// Use EJS for templating
app.set('views', 'tests/support/testserver/views');
app.set('view engine', 'ejs');

// Listen to all HTTP verbs, because the wrap makes POST requests
app.all('/:type/:count/', function (req, res) {
  // Verify URL params
  if(req.params.type !== 'premium' && req.params.type !== 'free') {
    return res.status(500).send('Error: Page type must be free or premium.');
  }
  if(isNaN(req.params.count) || req.params.count < 1) {
    return res.status(500).send('Error: Count must be a positive integer');
  }

  // Render our test page
  res.render('testpage.ejs', {
    type: req.params.type,
    premium: req.params.type === 'premium',
    count: parseInt(req.params.count, 10)
  });
});

// A page to show all the screenshots
app.get('/screenshots', function (req, res) {
  glob('tests/screenshots/*.png', function (err, files) {
    if(err) return res.status(500).send(err);

    return res.render('screenshots.ejs', {
      screenshots: files.map(function (file) {
        return '/' + path.basename(file);
      })
    });

  });
});

// Export the app so we can manage it with our grunt-express task
module.exports = app;
