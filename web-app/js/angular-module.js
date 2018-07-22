
var app = angular.module('myApp', ['angularModalService']);
var apiBaseURL = "http://localhost:3000/api/";
var namespace = "nz.ac.auckland"

app.controller('myCtrl', function ($scope, $http, ModalService) {

    $scope.healthProviderForm = {
        $class: "nz.ac.auckland.HealthProvider",
        id: "string",
        name: "string",
        phone: "string",
        address: "string",
        publicKey: "."
    };

    $scope.viewerForm = {
        $class: "nz.ac.auckland.Viewer",
        id: "string",
        healthProvider: ""
    }

    $scope.recordForm = {
        $class: "nz.ac.auckland.Record",
        id: "string",
        record_date: "string",
        record_code: "string",
        record_reasonCode: "string",
        record_reasonDesc: "string",
        healthProvider: ""
    }

    $scope.patientTab = true

    $scope.selectedRecord = {}
    $scope.types = ["Allergy", "Procedure", "Observation", "Medication", "Immunization", "Condition"]

    $scope.allergyForm = {}
    $scope.procedureForm = {}
    $scope.observationForm = {}
    $scope.medicationForm = {}
    $scope.immunizationForm = {}
    $scope.conditionForm = {}

    let _id;
    let _records;
    $scope.myArray = []


    $scope.viewData = function (data) {

        $('#json-renderer').jsonViewer(data, { collapsed: true });

    }

    $scope.submitHP = function () {
        var endpoint = apiBaseURL + "HealthProvider"
        $scope.endpoint = endpoint

        $http({
            method: 'POST',
            url: endpoint,
            data: angular.toJson($scope.healthProviderForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success, _error)
    }

    $scope.submitViewer = function () {
        var endpoint = apiBaseURL + "Viewer"
        $scope.endpoint = endpoint

        $scope.viewerForm.healthProvider = "resource:" + namespace + ".HealthProvider#" + $scope.viewerForm.healthProvider

        $http({
            method: 'POST',
            url: endpoint,
            data: angular.toJson($scope.viewerForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success, _error)
    }

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
        console.log(recordForm)
        var records = JSON.parse(_records)
        records.push(recordForm)


        var encryptedRecord = symEncrypt(JSON.stringify(records))
        encryptedRecord = JSON.parse(encryptedRecord)

        let updatedRecords = {
            updatedRecords: encryptedRecord.ct,
            patient: "resource:" + namespace + ".Patient#" + _id
        }
        console.log("ID: " + _id)

        var endpoint = apiBaseURL + "MedicalEncounter"
        $scope.endpoint = endpoint

        $http({
            method: 'POST',
            url: endpoint,
            data: angular.toJson(updatedRecords),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success, _error)
    }

    $scope.getPatients = function () {
        var endpoint = apiBaseURL + 'Patient'
        $scope.endpoint = endpoint

        $http.get(endpoint).then(function (response) {
            $scope.viewData(response.data)
            $scope.myStatus = response.status

            var tempRecords = response.data

            var keys = Object.keys(tempRecords)

            keys.forEach(function (key) {
                decryptForm(tempRecords[key])
            })

            $scope.myArray = tempRecords

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

    function decryptForm(form) {
        var keys = Object.keys(form)

        keys.forEach(function (key) {
            if (!(key == "$class" || key == "id")) {
                var decryptedData = symDecrypt(form[key])
                form[key] = decryptedData
            }
        })
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
                title: "A More Complex Example",
                patient: null,
                update: false
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

        });

    };
})