"use strict";

var app = angular.module('myApp', ['ngSanitize']);
var apiBaseURL = "http://localhost:3000/api/";

app.controller('myCtrl', function ($filter, $scope, $http) {

    $scope.healthProvider = {
        $class: "nz.ac.auckland.HealthProvider",
        hid: "string",
        name: "string",
        phone: "string",
        address: "string"
    };


    $scope.patient = {
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
        record: []
    }

    /**
     * Form fields corresponds to Job object. Fields show in the `Add Job` tab.
     *
     * @type {{supplierId: string, manualReview: boolean, jobStatus: string, lastStatusUpdate: string, jobId: string, workType: string, itemId: string}}
     */
    $scope.jobForm = {
        supplierId: "JAE",
        manualReview: true,
        jobStatus: "started",
        lastStatusUpdate: "2/1/18",
        jobId: "JAE22",
        workType: "manual",
        itemId: "123"
    }

    /**
     * Form fields corresponds to ClaimItem object. The fields show in the `Add Items` tab.
     *
     * @type {{itemId: string, serialNumber: string, repairable: boolean, purchaseDate: string, purchaseLoc: string, purchaseNew: boolean, purchaseOrigPrice: string, warranty: number}}
     */
    $scope.medicalEncounter = {
        $class: "nz.ac.auckland.MedicalEncounter",
        record: {
        $class: "nz.ac.auckland.Record",
            rid: "string",
            record_date: "string",
            record_code: "string",
            record_reasonCode: "string",
            record_reasonDesc: "string",
            heathProvider: {},
        id: "string"
    },
        patient: {}

    };

    /**
     * Sends InvoiceForm to the node Cordapp API
     */
    $scope.addInvoice = function () {

        var endpoint = apiBaseURL + "addInvoice?id=" + $scope.id
        $scope.endpoint = endpoint

        $http({
            method: 'PUT',
            url: endpoint,
            data: angular.toJson($scope.invoiceForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success, _error)
    }

    /**
     * Make box to see the contents of all unconsumed ClaimStates
     */
    $scope.viewClaims = function () {
        var endpoint = apiBaseURL + "getUnconsumedStates"

        $http.get(endpoint).then(function (response) {
            var count = response.data.length
            var claims = []
            var linearId = []
            $scope.unconsumedStates = response.data;

            $('#json-renderer').jsonViewer($scope.unconsumedStates, { collapsed: true });

        })
    }



    //filter to remove the notary node from peers list
    function checkNotary(list) {
        return list.search("Notary") == -1
    }

    //filter network map nodes from the peer list
    function checkNetwork(list) {
        return list.search("Network") == -1
    }

    /**
     * Sends the ClaimForm to the node Cordapp API. If the transaction is committed,
     * show the ClaimState in the `Active Claims` box.
     */
    $scope.initialiseClaim = function () {

        //retrieving a list of peers
        var endpoint = apiBaseURL + "me"
        $scope.endpoint = endpoint
        $http.get(endpoint).then(function (response) {
            var parties = [];
            parties.push(response.data.me);
            parties.push($scope.selectedPeer);
            $scope.claimForm.parties = parties;

            var endpoint = apiBaseURL + "createClaim"
            $scope.endpoint = endpoint

            $http({
                method: 'PUT',
                url: endpoint,
                data: angular.toJson($scope.claimForm),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function success(response) {
                $scope.viewClaims()
                $scope.myResponse = response.data
                $scope.myStatus = response.status
            }, _error)
        })
    }

    /**
     * This obtains the linear Id of the state selected in the `Active Claims` box. It also changes the fields
     * of UpdateForm to correspond with the Claim selected.
     *
     * @param state
     */
    $scope.selectState = function (state) {
        $scope.id = state.data.linearId.id
        $scope.selectedState = state;

        $scope.updateForm.claimNumber = state.data.claim.claimNumber
        $scope.updateForm.lossDesc = state.data.claim.lossDesc
        $scope.updateForm.date = state.data.claim.date
        $scope.updateForm.lossLoc = state.data.claim.lossLoc
        $scope.updateForm.phoneNum = state.data.claim.phoneNum
        $scope.updateForm.excess = state.data.claim.excess
        $scope.updateForm.cName = state.data.claim.cname

    }

    /**
     * Invokes the CloseClaim function at the Cordapp API for the specified claim.
     */
    $scope.closeClaim = function () {
        $scope.myResponse = "clicked"
        var endpoint = apiBaseURL + "closeClaim?id=" + $scope.id
        $scope.endpoint = endpoint

        $http.get(endpoint).then(function (response) {
            $scope.myStatus = response.status
            $scope.myResponse = response.data
        }, _error)
    }

    /**
     * Sends contents of UpdateForm to the node Cordapp API.
     */
    $scope.updateClaim = function () {
        $scope.myResponse = "clicked"
        console.log($scope.updateForm);
        var endpoint = apiBaseURL + "updateClaim?id=" + $scope.id;
        $scope.endpoint = endpoint;

        $scope.updateForm.parties = $scope.selectedState.data.parties;

        $http({
            method: 'PUT',
            url: endpoint,
            data: angular.toJson($scope.updateForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success, _error)
    }

    /**
     * Sends the contents of JobForm to the node Cordapp API
     */
    $scope.addJob = function () {
        $scope.myResponse = "clicked"

        var endpoint = apiBaseURL + "addJob?id=" + $scope.id
        $scope.endpoint = endpoint

        $http({
            method: 'PUT',
            url: endpoint,
            data: angular.toJson($scope.jobForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success, _error)
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
        }).then(function (response) {$scope.items = []; _success(response)}, _error)


    }

    /**
     * Show response message in a pop-up dialog box
     *
     * @param response
     * @private
     */
    function _success(response) {
        console.log(response);
        $scope.viewClaims();
        $scope.myStatus = response.status
        $scope.myResponse = response.data
        alert("Success: " + response.data);
    }

    /**
     * Show error message in a pop-up dialog box
     *
     * @param response
     * @private
     */
    function _error(response) {
        $scope.myResponse = response.statusText
        $scope.myStatus = response.status
        alert("The Corda Node returned an error: " + response.data)
    }

    init(); // run the init function
})