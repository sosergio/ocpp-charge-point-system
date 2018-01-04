//require('./services/logger.service').init();
var wsMessagesHandler = require('./handlers/websocket.handler');
var mqttMessagesHandler = require('./handlers/azure-mqtt.handler');
var virtualBobHandler = require('./handlers/virtual-bob.handler');
var ChargePoint = require('./charge-point');

exports.MqttHandler = mqttMessagesHandler;
exports.VirtualBobHandler = virtualBobHandler;
exports.WebSocketHandler = wsMessagesHandler;
exports.ChargePoint = ChargePoint;