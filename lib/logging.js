'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var winston = require('winston');
var util = require('util');
var url = require('url');

var accessDump = process.env.ACCESS_DUMP || false;
var accessLogfile = process.env.ACCESS_LOGFILE || 'logs/access-dump.log';

// configure formatter and fileLogger

var formatter = {
  timestamp: function timestamp() {
    return new Date().toISOString();
  },
  formatter: function formatter(options) {
    // Return string will be passed to logger.
    return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (options.message ? options.message : '') + (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
  }
};

var fileLogger = new winston.Logger({
  transports: [new winston.transports.File(Object.assign({}, formatter, {
    filename: accessLogfile,
    level: 'info'
  }))]
});

// use timestamp console formatter with winston 
winston.configure({
  transports: [new winston.transports.Console(formatter)]
});

// log all http requests 
var globalLog = require('global-request-logger');
globalLog.initialize();

globalLog.on('success', function (request, response) {
  var uri = url.parse(request.path).pathname;
  var info = request.method + ' http://' + request.host + ':' + request.port + uri + ' statusCode=' + response.statusCode;
  winston.info(info);

  if (accessDump) {
    fileLogger.warn({ timestamp: new Date().toISOString(), event: 'success', request: request, response: response });
  }
});

var botstateRegEx = /\/v3\/botstate\/([a-z0-9]*)\/users\/(.*)/;

globalLog.on('error', function (request, response) {
  if (botstateRegEx.test(request.path)) {
    var _botstateRegEx$exec = botstateRegEx.exec(request.path),
        _botstateRegEx$exec2 = _slicedToArray(_botstateRegEx$exec, 4),
        channel = _botstateRegEx$exec2[1],
        channelId = _botstateRegEx$exec2[2];

    winston.error('failed state call for user ' + channelId + ' on channel ' + channel);
  }

  var uri = url.parse(request.path).pathname;
  var info = request.method + ' http://' + request.host + ':' + request.port + uri + ' statusCode=' + response.statusCode;
  winston.info(info);

  if (accessDump) {
    fileLogger.warn({ timestamp: new Date().toISOString(), event: 'error', request: request, response: response }
    //    fileLogger.warn(util.inspect({ timestamp: new Date().toISOString(), event: 'error', request, response }, { breakLength: Infinity}))
    );
  }
});

// redirect all console.* calls to winston
function logging() {
  var text = util.format.apply(util, arguments);
  winston.info(text);
}

console.log = logging;
console.warn = logging;
console.info = logging;
console.error = logging;

// no need to export anything at the moment
module.export = {};
