const logger = require('./logger.service');
var _messageHandler;
var _remoteStartTransactionHandler;
var _remoteStopTransactionHandler;
var _msgsAwaitingResponse = [];

function log(msg) {
    logger.log(`ocpp.service | ${msg}`);
}

function awaitResponseTo(message, onResponse) {
    _msgsAwaitingResponse.push({
        message: message,
        onResponse: onResponse
    });
}

function matchResponseWith(responseMessage) {
    let msgId = responseMessage[1];
    let msgIndexInWaiters = -1;
    for (var i = 0; i < _msgsAwaitingResponse.length; i++) {
        if (_msgsAwaitingResponse[i].message[1] == msgId) {
            msgIndexInWaiters = i;
            break;
        }
    }
    if (msgIndexInWaiters != -1) {
        if (_msgsAwaitingResponse[msgIndexInWaiters].onResponse) {
            _msgsAwaitingResponse[msgIndexInWaiters].onResponse(responseMessage);
        }
        _msgsAwaitingResponse.splice(msgIndexInWaiters, 1);
    }
}

function sendOcppResponse(msgId, values) {
    let message = [3, msgId, values];
    _messageHandler.send(message);
}

function sendOcppCommand(procName, values, onSucc, onErr) {
    let message = [2, new Date().getTime().toString(), procName, values]
    _messageHandler.send(message, err => {
        if (err) {
            if (onErr) onErr(err);
        } else if (onSucc) {
            awaitResponseTo(message, onSucc);
        }
    });
}

var service = {
    setMessageHandler: function (handler, config) {
        _messageHandler = handler;
        _messageHandler.onMessage(payload => {
            let msg = JSON.parse(payload);
            if (msg && msg.length > 0) {
                let msgId = msg[1];
                let type = msg[0];
                let cmd = msg[2];
                if (type == 3) {
                    //match the response with an awaiting onResponse function
                    matchResponseWith(msg);
                } else {
                    if (this['_' + cmd]) {
                        this['_' + cmd](msg);
                    }
                }
            }
        });
    },

    sendBootNotification: function (payload, onSucc, onErr) {
        let values = {
            chargePointVendor: 'GIR-DBT',
            chargePointModel: 'OCPP-ACDC',
            chargePointSerialNumber: 'gir.vat.mx.000e48',
            chargeBoxSerialNumber: 'gir.vat.mx.000e48',
            firmwareVersion: '1.0.49',
            iccid: 'abc123',
            imsi: 'abc123',
            meterType: 'DBT NQC-ACDC',
            meterSerialNumber: 'gir.vat.mx.000e48'
        };
        sendOcppCommand("BootNotification", values, onSucc, onErr);
    },

    sendMeterReading: function (payload, onSucc, onErr) {
        let values = {
            connectorId: 1,
            transactionId: payload.transactionId,
            meterValue: [{
                timestamp: new Date().toISOString(),
                sampledValue: [{
                    value: payload.meters,
                    unit: "Wh",
                    measurand: "Energy.Active.Import.Register"
                }]
            }]
        };
        sendOcppCommand("MeterValues", values, onSucc, onErr);
    },
    sendStatusNotification: function (status, connectorId, onSucc, onErr) {
        let values = {
            connectorId: connectorId,
            errorCode: '',
            status: status,
            info: "",
            timestamp: new Date().toISOString(),
            vendorId: "",
            vendorErrorCode: ""
        };
        sendOcppCommand("StatusNotification", values, onSucc, onErr);
    },
    sendStartTransaction: function (payload, onSucc, onErr) {
        let values = {
            connectorId: 1,
            idTag: payload.id,
            meterStart: payload.meterStart,
            reservationId: 0,
            timestamp: new Date().toISOString()
        };
        sendOcppCommand("StartTransaction", values, onSucc, onErr);

    },
    sendStopTransaction: function (payload, onSucc, onErr) {
        let values = {
            "transactionId": payload.transactionId,
            "reason": payload.reason,
            "transactionData": [],
            "idTag": payload.transactionId.toString(),
            "timestamp": new Date().toISOString(),
            "meterStop": payload.meterStop
        };
        sendOcppCommand("StopTransaction", values, onSucc, onErr);
    },
    sendHeartbeat: function (payload, onSucc, onErr) {
        sendOcppCommand("Heartbeat", payload, onSucc, onErr);
    },
    onRemoteStartTransaction: function (remoteStartTransactionHandler) {
        _remoteStartTransactionHandler = remoteStartTransactionHandler;
    },
    onRemoteStopTransaction: function (remoteStopTransactionHandler) {
        _remoteStopTransactionHandler = remoteStopTransactionHandler;
    },

    _RemoteStartTransaction: function (payload) {
        let values = {
            status: _remoteStartTransactionHandler ? "Accepted" : "Rejected"
        };
        sendOcppResponse(payload[1], values);
        if (_remoteStartTransactionHandler)
            _remoteStartTransactionHandler(payload[3]);
    },
    _RemoteStopTransaction: function (payload) {
        let values = {
            status: _remoteStopTransactionHandler ? "Accepted" : "Rejected"
        };
        sendOcppResponse(payload[1], values);
        if (_remoteStopTransactionHandler)
            _remoteStopTransactionHandler(payload[3]);
    },
}

module.exports = service;