
var restify = require('restify');
var builder = require('botbuilder');
var logging = require('./logging');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.BOT_APP_ID,
    appPassword: process.env.BOT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Add help dialog
bot.dialog('/', function (session) {
    console.log(session.message.address);
    session.connector.getData({ userId: 1, persistUserData: true, address: session.message.address}, function(err, resp, body){        
        console.log(resp.userData);        
    });
});

function action() {
    connector.getData({ userId: 1, persistUserData: true, address: { channelId: 'slack'} },  function(err, resp, body){               
        console.log(resp.userData);        
    });
}

setInterval(function() { action(); }, 1000);
/*

url = this.settings.endpoint.stateEndpoint + '/v3/botstate/' + encodeURIComponent(address.channelId);
ChatConnector.prototype.authenticatedRequest = function (options, callback, refresh)
{"method":"POST","url":"http://127.0.0.1:50373/v3/botstate/emulator/users/1","body":{"eTag":"*","data":{"test":true}},"json":true}
*/