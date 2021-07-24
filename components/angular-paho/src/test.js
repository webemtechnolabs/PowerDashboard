(function () {
    angular.module('app', ['angularPaho']);
})();

(function () {
    angular.module('app').controller('test', function ($scope, MqttClient, $timeout) {

        var ip = "-- MQTT Server IP Address --";
        var port = "8083";
        var id = "WxDashboard-" + Math.random();
        var wasConnected = false;

        var con


        $scope.message = {};
        $scope.connected = false;
        $scope.time = "--:--";
        $scope.mqttUsername = "";
        $scope.mqttPassword = "";

        $scope.time = "--- --";

        $scope.bmpTemperature = "Err";
        $scope.bmpPressure = "Err";
        $scope.weather = "Unknown";
        

        $scope.btnText = "Login";
        $scope.btnDisabled = false;
        $scope.lastMessage = '';

        $scope.doLogin = function () {
            //alert('Will try to login with username ' + $scope.mqttUsername + ' and password ' + $scope.mqttPassword);
            $scope.btnDisabled = true;
            $scope.btnText = "Please wait...";

            doConnect();
            $timeout(connectionTest, 1000);
        }


        var reconnect = function () {
            MqttClient.init(ip, port, id, messageCallback, 10000, connectionLostCallback);
            doConnect();
            $timeout(connectionTest, 1000);
        }

        MqttClient.init(ip, port, id, messageCallback, 10000, connectionLostCallback);
        MqttClient.startTrace();
        
        function doConnect() {
            console.log('Trying to connect...');
            if (MqttClient.isConnected()) return;
            MqttClient.connect({
                onSuccess: successCallback,
                onFailure: connectedFailedCallback,
                userName: $scope.mqttUsername,
                password: $scope.mqttPassword,
                useSSL: true
            });
        }

        function connectedFailedCallback(obj) {
            if (!wasConnected) {
                //alert("Connection failed with error code " + obj.errorCode + " - " + obj.errorMessage);
                new Noty({
                    type: 'warning',
                    layout: 'top',
                    text: "Connection failed with error code " + obj.errorCode + " - " + obj.errorMessage,
                    timeout: 5000
                }).show();

                $scope.btnDisabled = false;
                $scope.btnText = "Login";
            } else {
                connectionLostCallback();   //Try again
            }
        }

        function messageCallback(message) {
            console.log('Incoming message...');
            if (message.destinationName === 'domoticz/out') {
                //Ensure it's a domoticz message.
                var payload = JSON.parse(message.payloadString);

                switch (payload.idx) {
                    case 1:
                        //baro
                        $scope.bmpPressure = (payload.svalue1 - 0).toFixed(1);

                        switch (payload.svalue2 - 0) {
                            case 0:
                                $scope.weather = 'Stable'; break;
                            case 1:
                                $scope.weather = 'Rising Slowly'; break;
                            case 2:
                                $scope.weather = 'Falling Slowly'; break;
                            case 3:
                                $scope.weather = 'Rising Quicly'; break;
                            case 4:
                                $scope.weather = 'Falling Quickly'; break;
                            default:
                                $scope.weather = 'Unknown'; break;
                        }
                        break;

                    case 2:
                        //baro temperature
                        $scope.bmpTemperature = (payload.svalue1 - 0).toFixed(1);
                        console.log("bmpTemperature", $scope.bmpTemperature);
                        break;
                    default:
                        break
                }

                $scope.message = payload;
                $scope.lastMessage = moment().format('HH:mm:ss');
                console.log(payload.idx, payload.svalue1);
                
            }
        }

        function successCallback() {
            if (wasConnected) {
                new Noty({
                    type: 'success',
                    layout: 'top',
                    text: "Connection successfull",
                    timeout: 5000
                }).show();
            } else {
                new Noty({
                    type: 'success',
                    layout: 'top',
                    text: "Login successfull",
                    timeout: 5000
                }).show();
            }
            console.log('Connection successful');
            MqttClient.subscribe('domoticz/out');
            $scope.connected = true;
            $scope.wasConnected = true;
        }

        function connectionTest() {
            $scope.connected = MqttClient.isConnected();
            $timeout(connectionTest, $scope.connected ? 500 : 5000);
        }

        function connectionLostCallback() {
            $scope.connected = false;
            new Noty({
                type: 'error',
                layout: 'top',
                text: "Connection lost. Reconnect in 30 seconds",
                timeout: 5000
            }).show();
            console.log("Connection lost. Reconnect in 30 seconds");
            $timeout(reconnect, 30000);
        }

        function updateTime() {
            $scope.time = moment().format('HH:mm');
            $scope.date = moment().format("MMM D")

            $timeout(updateTime, 1000);
        }

        updateTime();

        //doConnect();
    });
})();
