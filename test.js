require('./services/logger.service').init();
var messagesHandler = require('./handlers/websocket.handler');
var bobHandler = require('./handlers/virtual-bob.handler');
var config = require('./config.json');
var ChargePoint = require('./charge-point');

let cp = new ChargePoint();
cp.start(config, bobHandler, messagesHandler);

setTimeout(()=>{
    cp.hardwareService.setSuspendedEVSE();
},10000);

setTimeout(()=>{
    cp.hardwareService.setPreparing();
},20000);