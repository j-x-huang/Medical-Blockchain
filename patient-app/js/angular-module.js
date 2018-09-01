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


    $scope.shareForm = {
        patient: "",
        healthProvider: ""
    }

    $scope.myArray = []
    $scope.hpArray = []
    $scope.notiTable = []

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

    $scope.shareKey = function (index) {

        if ($scope.pid === '' || $scope.pid === undefined) {
            alert("Your ID is not stated")
            return
        }

        if ($scope.patientKey === '' || $scope.patientKey === undefined) {
            alert("You have not entered your patient key")
            return
        }

        var hid = $scope.notiTable[index].hid

        $scope.shareForm.$class = "nz.ac.auckland.ShareKey"
        $scope.shareForm.patient = "resource:" + namespace + ".Patient#" + $scope.pid
        $scope.shareForm.healthProvider = "resource:" + namespace + ".HealthProvider#" + hid

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

    $scope.viewKeys = function() {
        if ($scope.pid === '' || $scope.pid === undefined) {
            alert("Your ID is not stated")
            return
        }

        $scope.hpArray = []

        var endpoint = endpoint2 + 'selectPatientKeysByPatientID?p=resource%3Anz.ac.auckland.Patient%23' + $scope.pid;

        $http.get(endpoint).then( function (response) {
            var hps = new Set()

            response.data.forEach(function (data) {
                var hpLine = data.healthProvider.split('#')
                hpId = hpLine[1];

                hps.add(hpId)
            })
            console.log(hps)
            hps.forEach( function (hp) {
                $http.get(apiBaseURL + 'HealthProvider/' + hp).then( function (response) {
                    $scope.hpArray.push(response.data)
                }, _error)
            })

        }, _error)
    }

    $scope.revokeKey = function(index) {
        var hid = $scope.hpArray[index].id

        var endpoint = apiBaseURL + "RevokeMedicalRecordsSharing"

        var revokeForm = {
            $class: "nz.ac.auckland.RevokeMedicalRecordsSharing",
            patient: "resource:" + namespace + ".Patient#" + $scope.pid,
            healthProvider: $scope.shareForm.healthProvider = "resource:" + namespace + ".HealthProvider#" + hid
        }

        $http({
            method: 'POST',
            url: endpoint,
            data: angular.toJson(revokeForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success, _error)
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

        clearTables();

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

    function clearTables() {
        $scope.allergy=[]
        $scope.cond=[]
        $scope.imm=[]
        $scope.med=[]
        $scope.obs=[]
        $scope.proc=[]

        return
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
        if (data.$class === "nz.ac.auckland.RequestRecordSharingNotification") {
            var hpLine = data.healthProvider.split('#')
            var hpId = hpLine[1];
            console.log(hpLine)

            var pLine = data.patient.split('#')
            var pId = pLine[1]
            console.log(pLine)

            var timestamp = new Date(data.timestamp);

            var timeString = timestamp.toLocaleDateString('en-GB') + " @ " + timestamp.toLocaleTimeString('en-GB');

            if (pId === $scope.pid) {
                var notification = {
                    hid: hpId,
                    time: timeString,
                    Description: "Healthcare provider #" + hpId + " would like to view your records"
                }

                $scope.notiTable.push(notification)
                console.log($scope.notiTable)
            }
        }
    });

    $scope.refresh = function () {
        $scope.notiTable.reload();
    }
    
})