const WebSocket = require('ws');
const url = require('url');
const logger = require('./../services/logger.service');

function log(msg) {
    logger.log(`websocket.handler | ${msg}`);
}

var _ws;
var _openWs;
var _onMessageCallback;
var _onConnectedCallback;
var _onDisconnectedCallback;

var service = {
    init: function (config) {
        var self = this;
        log('initialized');
        let wsUrl = `${config.csUrl}/${config.cpId}`;
        _ws = new WebSocket(wsUrl);

        _ws.on('open', function open() {
            log('open');
            _openWs = _ws;
            setTimeout(() => {
                _onConnectedCallback();
            }, 1000);
        });

        _ws.on('message', function incoming(data) {
            log(`message: ${data}`);
            _onMessageCallback(data);
        });

        _ws.on('close', function () {
            log('disconnected');
            _onDisconnectedCallback();
        });

        _ws.on('error', (x) => {
            log('error');
            //console.log(x);
        });
        _ws.on('headers', x => {
            log('headers');
            //console.log(x);
        });
        _ws.on('ping', x => {
            log('ping');
            //console.log(x);
        });
        _ws.on('unexpected-response', x => {
            log('unexpected-response');
            //console.log(x);
        });
        _ws.on('pong', x => {
            log('pong');
            //console.log(x);
        });


    },
    onMessage: function (onMessageCallback) {
        _onMessageCallback = onMessageCallback;
    },
    onConnected: function (onConnectedCallback) {
        _onConnectedCallback = onConnectedCallback;
    },
    onDisconnected: function (onDisconnectedCallback) {
        _onDisconnectedCallback = onDisconnectedCallback;
    },
    send: function (payload, onResponse) {
        let stringified = JSON.stringify(payload);
        log(`send: ${stringified}`);
        try {
            _ws.send(stringified, function ack(error) {
                if (error) {
                    log(`error: ${error.toString()}`);
                }
                if (onResponse) onResponse(error);
            });
        } catch (err) {
            log(`error: ${err.toString()}`)
            if (onResponse) onResponse(error);
        }
    }

}

module.exports = service;