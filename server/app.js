const express = require('express');

const app = express();

app.set('views', './views');
app.set('view engine', 'ejs');

const index = require('./routes/index');
app.use('/', index);

const data = require('./routes/data');
app.use('/upload/', data);

const server = app.listen(3000, () => {
	console.log("Server running on port " + server.address().port);
});
