var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));
var routes = require('./routes');
var ejs = require('ejs');
var path = require('path');

//模板渲染
app.set('views', path.join(__dirname, 'views'));
app.engine('.html',ejs.__express)
app.set('view engine','html')

routes.detail(app);
app.listen(8083);

