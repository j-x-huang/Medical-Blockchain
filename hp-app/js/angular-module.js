var app = angular.module('myApp', ['angularModalService', 'ngMaterial', 'ngMessages', 'ngWebsocket']);
var apiBaseURL = "http://localhost:3000/api/";
var namespace = "nz.ac.auckland"
var endpoint2 = "http://localhost:3000/api/queries/"

app.controller('myCtrl', function ($scope, $http, $websocket, ModalService) {

    $scope.recordForm = {
        $class: "nz.ac.auckland.Record",
        id: "string",
        record_date: "string",
        record_code: "string",
        record_reasonCode: "string",
        record_reasonDesc: "string",
        healthProvider: "",
        patient: ""
    }

    $scope.hid
    $scope.hpArray = []
    $scope.keyArray = []

    $scope.patientTab = true

    $scope.pid
    $scope.patientKey
    $scope.privateKey

    $scope.notiArray = []

    $scope.selectedRecord = {}
    $scope.types = ["Allergy", "Procedure", "Observation", "Medication", "Immunization", "Condition"]

    $scope.allergyForm = {}
    $scope.procedureForm = {}
    $scope.observationForm = {}
    $scope.medicationForm = {}
    $scope.immunizationForm = {}
    $scope.conditionForm = {}

    let _id;
    $scope.myArray = []

    $scope.submitRecord = function () {
        var recordForm = {}
        switch ($scope.selectedRecord.type) {
            case 'Allergy':
                recordForm = $scope.allergyForm
                break
            case 'Procedure':
                recordForm = $scope.procedureForm
                break
            case 'Observation':
                recordForm = $scope.observationForm
                break
            case 'Immunization':
                recordForm = $scope.immunizationForm
                break
            case 'Condition':
                recordForm = $scope.conditionForm
                break
            case 'Medication':
                recordForm = $scope.medicationForm
                break;
        }
        recordForm = Object.assign({}, $scope.recordForm, recordForm)
        recordForm.$class = namespace + '.' + $scope.selectedRecord.type
        recordForm.patient = "resource:" + namespace + ".Patient#" + _id
        recordForm.healthProvider = "resource:" + namespace + ".HealthProvider#" + recordForm.healthProvider
        console.log(recordForm)

        encryptForm(recordForm)

        var endpoint = apiBaseURL + $scope.selectedRecord.type
        $scope.endpoint = endpoint

        $http({
            method: 'POST',
            url: endpoint,
            data: angular.toJson(recordForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success, _error)
    }

    $scope.getPatients = function () {
        var endpoint = apiBaseURL + 'Patient'

        $http.get(endpoint).then(function (response) {
            $scope.myArray = response.data
        }, _error)
    }

    $scope.getMe = function () {
        var endpoint = apiBaseURL + "HealthProvider/" + $scope.hid

        $http.get(endpoint).then(function (response) {
            console.log(response.data)
            $scope.hpArray = response.data
        }, _error)
    }

    $scope.reqKey = function () {

        if (!isCredsProvided()) {
            return
        }

        var endpoint = apiBaseURL + "RequestRecordSharing"

        var reqForm = {
            $class: "nz.ac.auckland.RequestRecordSharing",
            patient: "resource:" + namespace + ".Patient#" + $scope.pid,
            healthProvider: "resource:" + namespace + ".HealthProvider#" + $scope.hid
        }

        $http({
            method: 'POST',
            url: endpoint,
            data: angular.toJson(reqForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success, _error)
    }

    $scope.getKeys = function () {
        if (!isCredsProvided()) {
            return
        }

        $scope.keyArray = []

        var endpoint = endpoint2 + 'selectPatientKeysByHealthProviderID?hp=resource%3Anz.ac.auckland.HealthProvider%23' + $scope.hid;

        $http.get(endpoint).then(function (response) {
            response.data.forEach(function (data) {
                var pLine = data.patient.split('#')

                var pid = pLine[1]
                var encryptedKey = data.encryptedPatientKeyHPPublic

                var decryptedKey = $scope.tryDecrypt(encryptedKey)

                var keyOb = {
                    id: pid,
                    key: decryptedKey
                }

                $scope.keyArray.push(keyOb)
            })
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

    function encryptForm(form) {
        var keys = Object.keys(form)

        keys.forEach(function (key) {
            if (!(key == "$class" || key == "id" || key == "patient" || key == "healthProvider")) {
                var encryptedData = symEncrypt(form[key], $scope.patientKey)
                form[key] = encryptedData.toString()
            }

        })

        console.log(form)
    }

    /**
     * Show response message in a pop-up dialog box
     *
     * @param response
     * @private
     */
    function _success(response) {
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
        alert("Error: " + response.data)
    }


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
        });

    }

    $scope.handleFiles = function (files) {
        var file = files[0]
        var reader = new FileReader();
        reader.readAsBinaryString(file);

        reader.onload = function () {
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

    function isCredsProvided() {
        if ($scope.hid === undefined || $scope.hid === '' || $scope.privateKey === undefined) {
            alert("Credentials not fully supplied")
            return false
        }
        return true
    }


    var ws = $websocket.$new('ws://localhost:3000');

    ws.$on('$open', function () { // it listents for 'incoming event'
        console.log("WS Open");
    })
    .$on('$message', function (data) {
        console.log(data)
        if (data.$class === "nz.ac.auckland.ShareKeyNotification") {
            var kLine = data.key.split('#')
            var kId = kLine[1];

            var timestamp = new Date(data.timestamp);

            var timeString = timestamp.toLocaleDateString('en-GB') + " @ " + timestamp.toLocaleTimeString('en-GB');
            var notification = {
                time: timeString,
                msg: "Patient key #" + kId + " is now shared with you"
            }

            $scope.notiArray.unshift(notification)
        } else if (data.$class === "nz.ac.auckland.RevokeMedicalRecordsSharingNotification") {
            var pLine = data.patient.split('#')
            var pId = pLine[1]

            var timestamp = new Date(data.timestamp);

            var timeString = timestamp.toLocaleDateString('en-GB') + " @ " + timestamp.toLocaleTimeString('en-GB');
            var notification = {
                time: timeString,
                msg: "Patient #" + pId + " is no longer sharing their key with you :("
            }
            $scope.notiArray.unshift(notification)
        }
    });


    $scope.tryDecrypt = function (encryptedPkey) {

        return asymDecrypt(encryptedPkey, $scope.privateKey)

    }
})