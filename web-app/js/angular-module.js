
var app = angular.module('myApp', []);
var apiBaseURL = "http://localhost:3000/api/";
var namespace = "nz.ac.auckland"

app.controller('myCtrl', function ($scope, $http) {

    $scope.update= false;

    $scope.healthProviderForm = {
        $class: "nz.ac.auckland.HealthProvider",
        id: "string",
        name: "string",
        phone: "string",
        address: "string",
        publicKey: "."
    };


    $scope.patientForm = {
        $class: "nz.ac.auckland.Patient",
        id: "string",
        birthDate: "string",
        deathDate: "string",
        ird: "string",
        drivers: "string",
        passport: "string",
        prefix: "string",
        first: "string",
        last: "string",
        suffic: "string",
        maiden: "string",
        marital: "string",
        race: "string",
        ethinicity: "string",
        gender: "string",
        birthplace: "string",
        address: "string",
        records: ".",
        PkeyPpass: ".",
        PkeyHPpass: "."
    }

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
        healthProvider:""
    }

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


    $scope.viewData = function (data) {

        $('#json-renderer').jsonViewer(data, { collapsed: true });

    }

    $scope.submitPatient = function () {
        var endpoint = apiBaseURL + "Patient"
        $scope.endpoint = endpoint

        encryptForm($scope.patientForm)
        $http({
            method: 'POST',
            url: endpoint,
            data: angular.toJson($scope.patientForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success, _error)
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

    $scope.submitRecord = function (index) {
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
        $scope.recordForm = Object.assign($scope.recordForm, recordForm)
        var encryptedRecord = symEncrypt(JSON.stringify($scope.recordForm))
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

    $scope.delete = function (index) {
        var tag = $scope.myArray[index].$class
        var id = $scope.myArray[index].id
        tag = tag.replace(namespace + '.', '')

        var endpoint = apiBaseURL + tag + "/" + id
        $scope.endpoint = endpoint

        $http.delete(endpoint).then(_success, _error)
    }

    $scope.getData = function (tag) {
        var endpoint = apiBaseURL + tag
        $scope.endpoint = endpoint

        $http.get(endpoint).then(_success, _error)
    }

    $scope.getDetails = function (index) {
        console.log($scope.healthProviderForm)

        let details = $scope.myArray[index]
        for (var key in details) {
            if ($scope.healthProviderForm.hasOwnProperty(key)) {
                $scope.healthProviderForm[key] = details[key]
            }

        }
        console.log($scope.healthProviderForm)
    }

    $scope.getId = function (index) {
        _id = $scope.myArray[index].id
    }

    function encryptForm (form) {
        var keys = Object.keys(form)

        keys.forEach(function(key) {
            if (!(key == "$class" || key == "id")) {
                var encryptedData = symEncrypt(form[key])
                console.log()
                encryptedData = JSON.parse(encryptedData)
                form[key] = encryptedData.ct
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
        console.log(response);
        $scope.myArray = response.data
        $scope.viewData(response.data);
        $scope.myStatus = response.status
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
})