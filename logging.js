'use strict';

const winston = require('winston');
const util = require('util');
const url = require('url');

const accessDump = process.env.ACCESS_DUMP || false;
const accessLogfile = process.env.ACCESS_LOGFILE || 'logs/access-dump.log';

// configure formatter and fileLogger

let formatter = {
    timestamp: function() {
        return new Date().toISOString();
    },
    formatter: function(options) {
        // Return string will be passed to logger.
        return options.timestamp() +' '+ options.level.toUpperCase() +' '+ (options.message ? options.message : '') +
        (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
    }
}

var fileLogger = new (winston.Logger)({ 
    transports: [
      new winston.transports.File(Object.assign({}, formatter, {
        filename: accessLogfile,
        level: 'info',
      }))
    ]
});

// use timestamp console formatter with winston 
winston.configure({
    transports: [
      new (winston.transports.Console)(formatter)
    ]
});

// log all http requests 
var globalLog = require('global-request-logger');
globalLog.initialize();

globalLog.on('success', function(request, response) {
  let uri = url.parse(request.path).pathname;
  let info = `${request.method} http://${request.host}:${request.port}${uri} statusCode=${response.statusCode}`;
  winston.info(info);
 
  if (accessDump) {
    fileLogger.warn({ timestamp: new Date().toISOString(), event: 'success', request, response })
  }
});

var botstateRegEx = /\/v3\/botstate\/([a-z0-9]*)\/users\/(.*)/

globalLog.on('error', function(request, response) {
  if (botstateRegEx.test(request.path)) {
    let [,channel,channelId,,] = botstateRegEx.exec(request.path)
    winston.error(`failed state call for user ${channelId} on channel ${channel}`);
  } 
  
  let uri = url.parse(request.path).pathname;
  let info = `${request.method} http://${request.host}:${request.port}${uri} statusCode=${response.statusCode}`;
  winston.info(info);

  if (accessDump) {
    fileLogger.warn({ timestamp: new Date().toISOString(), event: 'error', request, response })
//    fileLogger.warn(util.inspect({ timestamp: new Date().toISOString(), event: 'error', request, response }, { breakLength: Infinity}))
  }
  
});

// redirect all console.* calls to winston
function logging(...params) {
  let text = util.format(...params)
  winston.info(text);
}

console.log = logging;
console.warn = logging;
console.info = logging;
console.error = logging;

// no need to export anything at the moment
module.export = {    
}