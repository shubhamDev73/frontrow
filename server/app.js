const express = require('express');

process.env.TZ = 'Asia/Kolkata';
const log = console.log;
console.log = (string) => {
	log.apply(console, ["[" + new Date().toLocaleString("es-CL") + "]"].concat(string));
};

const app = express();

app.set('views', './views');
app.set('view engine', 'ejs');

app.use((req, res, next) => {
	console.log(req.method + " " + req.url);
	next();
});

const index = require('./routes/index');
app.use('/', index);

const data = require('./routes/data');
app.use('/upload/', data);

const community = require('./routes/community');
app.use('/community/', community);

const api = require('./routes/api/index');
app.use('/api/', api);

const server = app.listen(3000, () => {
	console.log("Server running on port " + server.address().port);
});
