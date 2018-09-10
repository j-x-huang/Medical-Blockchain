var app = angular.module('myApp', ['angularModalService', 'ngMaterial', 'ngMessages', 'ngWebsocket']);
var apiBaseURL = "http://localhost:3000/api/";
var namespace = "nz.ac.auckland"

app.controller('myCtrl', function ($scope, $http, $websocket, ModalService) {

    $scope.healthProviderForm = {
        $class: "nz.ac.auckland.HealthProvider",
        id: "",
        name: "",
        phone: "",
        address: "",
        publicKey: "."
    };

    $scope.patientTab = true

    $scope.patientKey
    $scope.privateKey

    $scope.myArray = []


    $scope.viewData = function (data) {

        $('#json-renderer').jsonViewer(data, { collapsed: true });

    }

    $scope.submitHP = function () {
        var endpoint = apiBaseURL + "HealthProvider"
        $scope.endpoint = endpoint

        keys = generateRSAkeys()

        console.log(keys)

        $scope.healthProviderForm.publicKey = keys.publicKey
        $scope.privateKey = keys.privateKey

        $http({
            method: 'POST',
            url: endpoint,
            data: angular.toJson($scope.healthProviderForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            $scope.viewData(response.data);

            showCryptoModal("N/A", $scope.privateKey)
        }, _error)
    }

    $scope.getPatients = function () {
        var endpoint = apiBaseURL + 'Patient'
        $scope.endpoint = endpoint

        $http.get(endpoint).then(function (response) {
            $scope.viewData(response.data)
            $scope.myArray = response.data
            $scope.myStatus = response.status
        }, _error)
    }

    $scope.delete = function (index) {
        var isConfirmed = confirm("Are you sure you want to delete this patient?")

        if (isConfirmed) {
            var tag = $scope.myArray[index].$class
            var id = $scope.myArray[index].id
            tag = tag.replace(namespace + '.', '')

            var endpoint = apiBaseURL + tag + "/" + id
            $scope.endpoint = endpoint

            $http.delete(endpoint).then(_success, _error)
        } else {
            alert("Deletion averted")
        }
    }

    $scope.getData = function (tag) {
        var endpoint = apiBaseURL + tag
        $scope.endpoint = endpoint

        $http.get(endpoint).then(function (response) {
            $scope.myArray = response.data
            $scope.viewData(response.data);
            $scope.myStatus = response.status
        }, _error)
    }

    $scope.setTab = function (tag) {
        if (tag === 'Patient') {
            $scope.patientTab = true;
            $scope.getPatients()
        } else {
            $scope.patientTab = false;
            $scope.getData(tag)
        }
    }

    $scope.getId = function (index) {
        _id = $scope.myArray[index].id
        _records = $scope.myArray[index].records
    }

    /**
     * Show response message in a pop-up dialog box
     *
     * @param response
     * @private
     */
    function _success(response) {
        $scope.viewData(response.data);
        $scope.myStatus = response.status
        alert("Operation successful")
    }

    /**
     * Show error message in a pop-up dialog box
     *
     * @param response
     * @private
     */
    function _error(response) {
        console.log(response)
        $scope.myStatus = response.status
        alert("Error: " + response.data)
    }

    $scope.addPatient = function () {
        ModalService.showModal({
            templateUrl: "./patientModal.html",
            controller: "PatientController",
            preClose: (modal) => { modal.element.modal('hide'); },
            inputs: {
                title: "Register",
                patient: null,
                update: false
            }
        }).then(function (modal) {
            modal.element.modal();
            modal.close.then(function (result) {
                $('.modal-backdrop').remove()

                if (result.patientKey === undefined || result.privateKey === undefined) {
                    //
                } else {
                    $scope.patientKey = result.patientKey
                    $scope.privateKey = result.privateKey

                    showCryptoModal(result.patientKey, result.privateKey)
                }
            })


        });
    }

    function showCryptoModal(patientKey, privateKey) {
        ModalService.showModal({
            templateUrl: "./cryptoModal.html",
            controller: "cryptoController",
            preClose: (modal) => { modal.element.modal('hide'); },
            inputs: {
                patientKey: patientKey,
                privateKey: privateKey
            }
        }).then(function (modal) {
            modal.element.modal();

        });
    }

    $scope.editPatient = function (index) {

        var patientDetails = $scope.myArray[index]
        ModalService.showModal({
            templateUrl: "./patientModal.html",
            controller: "PatientController",
            preClose: (modal) => { modal.element.modal('hide'); },
            inputs: {
                title: "A More Complex Example",
                patient: patientDetails,
                update: true
            }
        }).then(function (modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                $('.modal-backdrop').remove()
              });

        });

    };

    $scope.viewRecords = function (index) {
        var patient = $scope.myArray[index]

        ModalService.showModal({
            templateUrl: "./recordsModal.html",
            controller: "recordsController",
            preClose: (modal) => { modal.element.modal('hide'); },
            inputs: {
                title: "Patient Details",
                patient: patient,
                patientKey: $scope.patientKey
            }
        }).then(function (modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                $('.modal-backdrop').remove()
              });
        });

    }

    $scope.addRecord = function (index) {
        var id = $scope.myArray[index].id

        ModalService.showModal({
            templateUrl: "./addRecordModal.html",
            controller: "addRecordController",
            preClose: (modal) => { modal.element.modal('hide'); },
            inputs: {
                _id: id,
                patientKey: $scope.patientKey
            }
        }).then(function (modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                $('.modal-backdrop').remove()
              });
        });

    }

    $scope.handleFiles = function (files) {
        var file = files[0]
        var reader = new FileReader();
        reader.readAsBinaryString(file);

        reader.onload=function(){
            var str = reader.result

            if (file.type == "text/plain") {
                $scope.patientKey = str
            } else if (file.type == "application/x-x509-ca-cert") {
                $scope.privateKey = str
            } else {
                error("Unable to read file")
            }
        }
    }


    var ws = $websocket.$new('ws://localhost:3000');

    ws.$on('$open', function () { // it listents for 'incoming event'
      console.log("WS Open");
    })
    .$on('$message', function (data) {
        console.log(data)
    });
    
    $scope.encryptedPkey
    $scope.decryptedKey

    $scope.testDecrypt = function() {
        console.log($scope.encryptedPkey)
        console.log($scope.privateKey)
        $scope.decryptedKey = asymDecrypt($scope.encryptedPkey, $scope.privateKey)

    }

    $scope.notiArray = []

    var ws = $websocket.$new('ws://localhost:3000');

    ws.$on('$open', function () { // it listents for 'incoming event'
        console.log("WS Open");
    })
    .$on('$message', function (data) {
        console.log(data)
        if (data.$class === "nz.ac.auckland.ShareKeyNotification") {
            var hpLine = data.healthProvider.split('#')
            var hpId = hpLine[1];

            var pLine = data.patient.split('#')
            var pId = pLine[1]

            var timestamp = new Date(data.timestamp);

            var timeString = timestamp.toLocaleDateString('en-GB') + " @ " + timestamp.toLocaleTimeString('en-GB');

            var notification = {
                time: timeString,
                msg: "Patient #" + pId + " has shared their key with HP #" + hpId
            }
            $scope.notiArray.unshift(notification)
        } else if (data.$class === "nz.ac.auckland.RevokeMedicalRecordsSharingNotification") {
            var pLine = data.patient.split('#')
            var pId = pLine[1]

            var hpLine = data.healthProvider.split('#')
            var hpId = hpLine[1]

            var timestamp = new Date(data.timestamp);

            var timeString = timestamp.toLocaleDateString('en-GB') + " @ " + timestamp.toLocaleTimeString('en-GB');
            var notification = {
                time: timeString,
                msg: "Patient #" + pId + " stopped sharing their key with HP #" + hpId
            }
            $scope.notiArray.unshift(notification)

        } else if (data.$class === "nz.ac.auckland.RequestRecordSharingNotification") {
            var hpLine = data.healthProvider.split('#')
            var hpId = hpLine[1];

            var pLine = data.patient.split('#')
            var pId = pLine[1]

            var timestamp = new Date(data.timestamp);

            var timeString = timestamp.toLocaleDateString('en-GB') + " @ " + timestamp.toLocaleTimeString('en-GB');

            var notification = {
                time: timeString,
                msg: "HP #" + hpId + " has requested a key from Patient #" + pId
            }
            $scope.notiArray.unshift(notification)

        }

    });

    
})