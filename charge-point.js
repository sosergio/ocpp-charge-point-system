var logger = require('./services/logger.service');
var worker = require('./services/worker.service');
var ocpp = require('./services/ocpp.service');
var hw = require('./services/hw.service');

function ChargePoint() {

  this.hardwareService = hw;
  this.ocppService = ocpp;
  var _currentTx;

  function log(msg) {
    logger.log(`cp | ${msg}`);
  }

  function stopTransactionNow(reason) {
    let mr = hw.readMeterReading();
    ocpp.sendStopTransaction({
      transactionId: _currentTx.id,
      reason: reason,
      meterStop: mr
    });
    _currentTx = null;
  }

  function startTransactionNow() {
    let mr = hw.readMeterReading();
    ocpp.sendStartTransaction({
        id: _currentTx.id,
        meterStart: mr
      },
      response => {
        _currentTx.status = "InProgress";
        hw.setCharging();
      });
  }

  this.start = function (config, bobHandler, message2CloudHandler) {
    log('started');

    hw.setBobHandler(bobHandler);
    ocpp.setMessageHandler(message2CloudHandler, config);

    message2CloudHandler.init(config);

    message2CloudHandler.onConnected(() => {
      ocpp.sendBootNotification(config,
        response => {
          let status = hw.readConnectorStatus();
          ocpp.sendStatusNotification(status, 1);

          worker.startHeartbeatJob(() => {
            ocpp.sendHeartbeat(new Date())
          });

          worker.startMeterReadingJob(() => {
            let mr = hw.readMeterReading();
            ocpp.sendMeterReading({
              meters: mr,
              transactionId: _currentTx && _currentTx.id
            });
          });
        },
        error => {
          log('BootNotification error. Retry in 1 minutes for 3 times');
          //todo
        });

    });


    message2CloudHandler.onDisconnected(() => {
      log('disconnected');
      worker.pauseHeatbeatJob();
      setTimeout(() => {
        message2CloudHandler.init(config);
      }, 1000);
    });

    hw.onConnectorStatusUpdate(status => {
      ocpp.sendStatusNotification(status, 1);
      if (_currentTx && _currentTx.status == "StartRequested" && status == "Preparing") {
        startTransactionNow();
      }
    });

    ocpp.onRemoteStartTransaction(payload => {
      _currentTx = {
        id: payload.idTag,
        status: "StartRequested"
      };
      if (hw.readConnectorStatus() == "Preparing") {
        startTransactionNow();
      } else {
        worker.connectorNotPlugged(() => {
          if (_currentTx && _currentTx.status == "StartRequested") {
            stopTransactionNow("EVDisconnected");
          }
        });
      }
    });

    ocpp.onRemoteStopTransaction(payload => {
      hw.setFinishing();
      stopTransactionNow("Remote");
    });
  }
}


module.exports = ChargePoint;