var app = angular.module('myApp', ['angularModalService', 'ngMaterial', 'ngMessages', 'ngWebsocket', 'ngRoute']);
var apiBaseURL = "http://localhost:3000/api/";
var endpoint2 = "http://localhost:3000/api/queries/"

var namespace = "nz.ac.auckland"

app.service("myService", function() {
    return {
        patientKey: "",
        privateKey: "",
        id: "",
        details: undefined
    }
});


app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl: "login.html",
        controller: "loginCtrl"
    })
    .when("/main", {
        templateUrl : "main.html",
        controller: "myCtrl",
        resolve:{
            check: function(myService, $location) {
                console.log(myService.id)
                if(myService.patientKey === "" || myService.privateKey === "" || myService.id === "" || myService.id === undefined || myService.details === undefined) {
                    $location.path('/');  //redirect user to home if it does not have permission.
                    alert("Details are missing");
                }
                
            }
        }
    })
});


app.controller('loginCtrl', function($scope, $http, $location, myService) {
    $scope.id;

    $scope.handleFiles = function (files) {
        var file = files[0]
        var reader = new FileReader();
        reader.readAsBinaryString(file);

        reader.onload=function(){
            var str = reader.result

            if (file.type == "text/plain") {
                myService.patientKey = str
                alert('Patient key successfully submitted')
            } else if (file.type == "application/x-x509-ca-cert") {
                myService.privateKey = str
                alert('Private key successfully submitted')
            } else {
                alert("Unable to read file")
            }
        }
    }

    $scope.login = function() {
        myService.id = $scope.id

        var endpoint = apiBaseURL + 'Patient/' + myService.id
        $scope.endpoint = endpoint

        $http.get(endpoint).then(function (response) {
            myService.details = response.data
            $location.path("/main")

        }, function (res) {
            alert("Patient does not exist")
        })

    }

})


app.controller('myCtrl', function ($scope, $http, $websocket, ModalService, myService) {

    console.log(myService.id)
    console.log(myService.patientKey)
    console.log(myService.privateKey)


    $scope.allergy=[]
    $scope.cond=[]
    $scope.imm=[]
    $scope.med=[]
    $scope.obs=[]
    $scope.proc=[]

    $scope.pid = myService.id
    $scope.hid
    let _login = true

    $scope.patientTab = true

    $scope.patientKey = myService.patientKey
    $scope.privateKey = myService.privateKey


    $scope.shareForm = {
        patient: "",
        healthProvider: ""
    }

    $scope.myArray = myService.details
    $scope.hpArray = []
    $scope.notiTable = []

    $scope.login = function () {
        var endpoint = apiBaseURL + 'Patient/' + $scope.pid
        $scope.endpoint = endpoint

        $http.get(endpoint).then(function (response) {
            $scope.myArray = response.data
            _login = true;
        }, _error)
    }

    $scope.shareKey = function (index) {

        if (!isCredsProvided()) {
            return
        }
        var hid = ''
        if (index === undefined || index === null || index === '') {
            hid = $scope.hid
        } else {
            hid = $scope.notiTable[index].hid
        }

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
                }).then(_success(null, $scope.viewKeys), _error)

            }, _error)
    }

    $scope.viewKeys = function() {
        if (!isCredsProvided()) {
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
            healthProvider: "resource:" + namespace + ".HealthProvider#" + hid
        }

        $http({
            method: 'POST',
            url: endpoint,
            data: angular.toJson(revokeForm),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(_success(null, $scope.viewKeys), _error)
    }

    $scope.setTab = function (tag) {
        if (tag === 'MyRecords') {
            $scope.getAllRecords()
        } else if (tag === 'MySharedKeys') {
            $scope.viewKeys()
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
    function _success(response, callback) {
        alert("Operation successful")

        if (callback !== undefined) {
            setTimeout(function(){
                callback()
            }, 2500);
        }
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
            modal.close.then(function(result) {
                $('.modal-backdrop').remove()
              });

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
                alert('Patient key successfully submitted')
            } else if (file.type == "application/x-x509-ca-cert") {
                $scope.privateKey = str
                alert('Private key successfully submitted')
            } else {
                alert("Unable to read file")
            }
        }
    }


    $scope.getAllRecords = function () {

        if (!isCredsProvided()) {
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

                $scope.notiTable.unshift(notification)
                console.log($scope.notiTable)
            }
        }
    });

    function isCredsProvided() {
        if (_login === false) {
            alert("Credentials not fully supplied")
            return false
        }
        return true
    }

    $scope.refresh = function () {
        $scope.notiTable.reload();
    }

})