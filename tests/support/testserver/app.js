var express = require('express'),
    app = express();

// Serve scraped wrap files
app.use(express.static('dist'));

// Use EJS for templating
app.set('views', 'tests/support/testserver/views');
app.set('view engine', 'ejs');

// Listen to all HTTP verbs, because the wrap makes POST requests
app.all('/:type/:count/', function (req, res) {
  // Verify URL params
  if(req.params.type !== 'premium' && req.params.type !== 'free') {
    return res.send('Error: Page type must be free or premium.', 500);
  }
  if(isNaN(req.params.count) || req.params.count < 1) {
    return res.send('Error: Count must be a positive integer', 500);
  }

  // Render our test page
  res.render('template.ejs', {
    type: req.params.type,
    premium: req.params.type === 'premium',
    count: parseInt(req.params.count, 10)
  });
});

// Export the app so we can manage it with our grunt-express task
module.exports = app;
