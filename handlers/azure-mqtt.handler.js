const Client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;
const Protocol = require('azure-iot-device-mqtt').Mqtt;

const logger = require('./../services/logger.service');

function log(msg) {
    logger.log(`azure-mqtt.handler | ${msg}`);
}

var _onMessageCallback;
var _onConnectedCallback;
var _onDisconnectedCallback;
var _client; // IoT hub connection client

var service = {
    init: function (config) {
        log('initialized');
        let connectionString = config.csUrl;
        _client = Client.fromConnectionString(connectionString, Protocol);

        _client.open(function (err) {
            if (err) {
                console.error('[IoT hub Client] Connect error: ' + err.message);
                return;
            }
            log('open');
            setTimeout(() => {
                _onConnectedCallback();
            }, 1000);

            // set C2D and device method callback
            _client.onDeviceMethod('start', onStart);
            _client.onDeviceMethod('stop', onStop);
            
            _client.on('message', function(msg) {
                var message = msg.getData().toString('utf-8');
                _onMessageCallback(message);
                _client.complete(msg, function () {
                    log(`Receive message: ${message}`);
                });
            });
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
            _client.sendEvent(stringified, function (err) {
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


function onStart(request, response) {
    console.log('Try to invoke method start(' + request.payload + ')');
    sendingMessage = true;

    response.send(200, 'Successully start sending message to cloud', function (err) {
        if (err) {
            console.error('[IoT hub Client] Failed sending a method response:\n' + err.message);
        }
    });
}

function onStop(request, response) {
    console.log('Try to invoke method stop(' + request.payload + ')');
    sendingMessage = false;

    response.send(200, 'Successully stop sending message to cloud', function (err) {
        if (err) {
            console.error('[IoT hub Client] Failed sending a method response:\n' + err.message);
        }
    });
}

module.exports = service;