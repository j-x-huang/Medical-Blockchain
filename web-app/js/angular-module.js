var app = angular.module('myApp', ['angularModalService', 'ngMaterial', 'ngMessages', 'ngWebsocket']);
var apiBaseURL = ADMIN_ENDPOINT;
var namespace = "nz.ac.auckland"
var webport = ADMIN_ENDPOINT.replace("/api/", "")
webport = webport.replace("http", "ws")

app.controller('myCtrl', function ($scope, $http, $websocket, ModalService) {

    // ----- Fields ------
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
    $scope.notiArray = []

    $scope.encryptedPkey
    $scope.decryptedKey

    $scope.hppub
    $scope.wKey

    //----- End Fields ------

    // view JSON data on screen
    $scope.viewData = function (data) {

        $('#json-renderer').jsonViewer(data, { collapsed: true });

    }

    // ------ CRUD functions -------
    $scope.submitHP = function () {
        var endpoint = apiBaseURL + "HealthProvider"

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

        $http.get(endpoint).then(function (response) {
            $scope.viewData(response.data)
            $scope.myArray = response.data
        }, _error)
    }

    // handles deletion for either patients or HPs
    $scope.delete = function (index) {
        var isConfirmed = confirm("Are you sure you want to delete this entity?")

        if (isConfirmed) {
            var tag = $scope.myArray[index].$class
            var id = $scope.myArray[index].id
            tag = tag.replace(namespace + '.', '')

            var endpoint = apiBaseURL + tag + "/" + id

            $http.delete(endpoint).then(function (response) {
                $scope.viewData(response.data);
                alert("Operation successful");
                $scope.getPatients()
                $scope.getData("HealthProvider")
            }, _error)
        } else {
            alert("Deletion averted")
        }
    }

    // Fetchs data (patient or hp depending on tag) and puts in my Array.
    $scope.getData = function (tag) {
        var endpoint = apiBaseURL + tag
        $scope.endpoint = endpoint

        $http.get(endpoint).then(function (response) {
            $scope.myArray = response.data
            $scope.viewData(response.data);
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

    // Get ID of participant in the table row which was clicked on
    $scope.getId = function (index) {
        _id = $scope.myArray[index].id
        _records = $scope.myArray[index].records
    }

    // ------ END CRUD FUNCTIONS ------

    // ----- MODALS -------
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
            modal.close.then(function (result) {
                $scope.getPatients()
                $scope.getData("HealthProvider")
            })

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
            modal.close.then(function (result) {
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
            modal.close.then(function (result) {
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
            modal.close.then(function (result) {
                $('.modal-backdrop').remove()
            });
        });

    }

    // ----- END MODALS -------

    // ----- RESPONSE HANDLING -----
    /**
     * Show response message in a pop-up dialog box
     *
     * @param response
     * @private
     */
    function _success(response) {
        $scope.viewData(response.data);
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
        alert("Error: " + response.data.error.message);
    }

    // ----- END RESPONSE HANDLING -------

    /**
     * handles uploading of files such as patient or private-public key
     */
    $scope.handleFiles = function (files) {
        var file = files[0]
        var reader = new FileReader();
        reader.readAsBinaryString(file);

        reader.onload = function () {
            var str = reader.result

            if (file.type == "text/plain") { // if patient key
                $scope.patientKey = str
            } else if (file.type == "application/x-x509-ca-cert") { // if private key
                $scope.privateKey = str
            } else {
                error("Unable to read file")
            }
        }
    }


    // ------ ENCRYPTION HANDLING -----
    $scope.testDecrypt = function () {
        console.log($scope.encryptedPkey)
        console.log($scope.privateKey)
        $scope.decryptedKey = asymDecrypt($scope.encryptedPkey, $scope.privateKey)

    }

    $scope.makeKey = function () {
        $scope.patientKey = generateRandomKey()
    }


    $scope.wrapKey = function () {
        $scope.wKey = asymEncrypt(
            $scope.patientKey,
            $scope.hppub
        );

    }

    // ------ END ENCRYPTION HANDLING ------


    // ----- Web socket and event handling logic -----
    var ws = $websocket.$new(webport);

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

    $scope.getPatients()


})