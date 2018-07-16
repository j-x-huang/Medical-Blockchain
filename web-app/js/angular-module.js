
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


    $scope.myArray = []


    $scope.viewData = function (data) {

        $('#json-renderer').jsonViewer(data, { collapsed: true });

    }

    $scope.submitPatient = function () {
        var endpoint = apiBaseURL + "Patient"
        $scope.endpoint = endpoint

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
        $scope.recordForm = Object.assign($scope.recordForm, recordForm)
        var encryptedRecord = symEncrypt(JSON.stringify($scope.recordForm),'5266556A586E3272357538782F413F442A472D4B6150645367566B5970337336')
        encryptedRecord = JSON.parse(encryptedRecord)
        console.log(encryptedRecord)
        console.log(encryptedRecord.ct)
        let decryptedRecord = symDecrypt(encryptedRecord.ct, '5266556A586E3272357538782F413F442A472D4B6150645367566B5970337336', encryptedRecord.iv)
        console.log(decryptedRecord)
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

    /**
     * Store the current state of the ItemForm in web cache
     */
    $scope.addItemToCache = function () {
        const item = Object.assign({}, $scope.itemForm)
        $scope.items.push(item)
        $scope.myResponse = "Item added (locally, not to node)"
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