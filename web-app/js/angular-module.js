var app = angular.module('myApp', []);
var apiBaseURL = "http://localhost:3000/api/";
var namespace = "nz.ac.auckland"

app.controller('myCtrl', function ($scope, $http) {

    $scope.healthProviderForm = {
        $class: "nz.ac.auckland.HealthProvider",
        hid: "string",
        name: "string",
        phone: "string",
        address: "string",
        publicKey: "."
    };


    $scope.patientForm = {
        $class: "nz.ac.auckland.Patient",
        pid: "string",
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
        records: "",
        PKeyPpass: ".",
        PkeyHPpass: "."
    }

    $scope.viewerForm = {
        $class: "nz.ac.auckland.Viewer",
        vid: "string",
        healthProvider: ""
    }

    $scope.medicalEncounterForm = {
        $class: "nz.ac.auckland.MedicalEncounter",
        record: {
            $class: "nz.ac.auckland.Record",
            rid: "string",
            record_date: "string",
            record_code: "string",
            record_reasonCode: "string",
            record_reasonDesc: "string",
            healthProvider: {},
            id: "string"
        },
        patient: {}

    };

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
     * Send all ItemForms in cache to the node Cordapp API
     */
    $scope.addItemsToNode = function () {
        $scope.myResponse = "clicked"
        var endpoint = apiBaseURL + "addItems?id=" + $scope.id
        $scope.endpoint = endpoint

        console.log($scope.items)
        $http({
            method: 'PUT',
            url: endpoint,
            data: angular.toJson($scope.items),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) { $scope.items = []; _success(response) }, _error)


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