var app = angular.module('myApp', ['angularModalService', 'ngMaterial', 'ngMessages', 'ngWebsocket']);
var apiBaseURL = "http://localhost:3000/api/";
var endpoint2 = "http://localhost:3000/api/queries/"

var namespace = "nz.ac.auckland"

app.controller('myCtrl', function ($scope, $http, $websocket, ModalService) {

    $scope.allergy=[]
    $scope.cond=[]
    $scope.imm=[]
    $scope.med=[]
    $scope.obs=[]
    $scope.proc=[]

    $scope.pid

    $scope.patientTab = true

    $scope.patientKey
    $scope.privateKey

    $scope.selectedRecord = {}
    $scope.types = ["Allergy", "Procedure", "Observation", "Medication", "Immunization", "Condition"]

    $scope.shareForm = {
        patient: "",
        healthProvider: ""
    }

    $scope.myArray = []


    $scope.getPatient = function () {
        if ($scope.pid === '' || $scope.pid === undefined) {
            alert("Your ID is not stated")
            return
        }
        var endpoint = apiBaseURL + 'Patient/' + $scope.pid
        $scope.endpoint = endpoint

        $http.get(endpoint).then(function (response) {
            console.log(response.data)
            $scope.myArray = response.data
        }, _error)
    }

    $scope.shareKey = function () {


        var hid = $scope.shareForm.healthProvider

        $scope.shareForm.$class = "nz.ac.auckland.ShareKey"
        $scope.shareForm.patient = "resource:" + namespace + ".Patient#" + $scope.shareForm.patient
        $scope.shareForm.healthProvider = "resource:" + namespace + ".HealthProvider#" + $scope.shareForm.healthProvider

        $http.get(apiBaseURL + "HealthProvider/" + hid)
            .then(function (response) {
                console.log(response.data)

                var hp = response.data

                encryptedPatientKeyHPPublic = asymEncrypt($scope.patientKey, hp.publicKey)

                $scope.shareForm.encryptedPatientKeyHPPublic = encryptedPatientKeyHPPublic

                var endpoint = apiBaseURL + "ShareKey"
                $scope.endpoint = endpoint

                $http({
                    method: 'POST',
                    url: endpoint,
                    data: angular.toJson($scope.shareForm),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(_success, _error)

            }, _error)
    }

    $scope.getData = function (tag) {
        var endpoint = apiBaseURL + tag
        $scope.endpoint = endpoint

        $http.get(endpoint).then(function (response) {
            $scope.myArray = response.data
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

    $scope.editPatient = function () {

        var patientDetails = $scope.myArray
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


    $scope.getAllRecords = function () {

        if ($scope.pid === '' || $scope.pid === undefined || $scope.patientKey === undefined) {
            alert("Your ID is not stated")
            return
        }

        getRecords(endpoint2 + "selectAllAllergyRecords?p=resource%3Anz.ac.auckland.Patient%23" + $scope.pid, $scope.allergy)
        getRecords(endpoint2 + "selectAllConditionRecords?p=resource%3Anz.ac.auckland.Patient%23" + $scope.pid, $scope.cond)
        getRecords(endpoint2 + "selectAllImmunizationRecords?p=resource%3Anz.ac.auckland.Patient%23" + $scope.pid, $scope.imm)
        getRecords(endpoint2 + "selectAllMedicationRecords?p=resource%3Anz.ac.auckland.Patient%23" + $scope.pid, $scope.med)
        getRecords(endpoint2 + "selectAllObservationRecords?p=resource%3Anz.ac.auckland.Patient%23" + $scope.pid, $scope.obs)
        getRecords(endpoint2 + "selectAllProcedureRecords?p=resource%3Anz.ac.auckland.Patient%23" + $scope.pid, $scope.proc)
    }

    function getRecords(query, array) {
        $http.get(query).then(function(response) {

            var tempArray= response.data

            tempArray.forEach(function (form) {
                decryptForm(form)
            })

            console.log(tempArray)

            array.push.apply(array,tempArray)
            console.log(array)
        }, _error);
    }

    function decryptForm(form) {
        var keys = Object.keys(form)

        keys.forEach(function (key) {
            if (!(key == "$class" || key == "id" || key == "patient" || key == "healthProvider")) {
                var decryptedData = symDecrypt(form[key], $scope.patientKey)
                form[key] = decryptedData
            }
        })
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
})