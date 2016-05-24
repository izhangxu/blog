var express = require('express');
var path = require('path');
var fs = require('fs');
//favicon网站头像
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//session会话存储
var session = require('express-session');
//链接mongodb
// var MongoStore = require('connect-mongo')(session);
//提示
var flash = require('connect-flash');
//加密
var crypto = require('crypto');

//引入路由
var routes = require('./routes/index');
var users = require('./routes/users');
var settings = require('./setting');
var app = express();
var accessLog = fs.createWriteStream('access.log', {
    flags: 'a'
});
var errorLog = fs.createWriteStream('error.log', {
    flags: 'a'
});

// view engine setup
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cookieParser('keyboard cat'));
app.use(session({
    secret: settings.cookieSecret,
    key: settings.db,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30
    },
    url: settings.url
}));
app.use(flash());


// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err, req, res, next) {
    var meta = '[' + new Date() + '] ' + req.url + '\n';
    errorLog.write(meta + err.stack + '\n');
    next();
});

/*app.use(session({
    secret: settings.cookieSecret,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30
    },
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        url: 'mongodb://localhost:27017/blog',
        ttl: 14 * 24 * 60 * 60
    })
}));*/

var mongoose = require('mongoose');
var options = {
    server: {
        socketOptions: {
            keepAlive: 1
        }
    }
};
mongoose.connect('mongodb://localhost:27017/blog', options, function(err) {
    if (err) {
        console.log('数据库连接失败');
    } else {
        console.log('数据库连接成功');
    }
});

routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
