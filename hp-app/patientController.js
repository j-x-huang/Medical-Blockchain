var app = angular.module('myApp');
var apiBaseURL = HP_ENDPOINT;

app.controller('PatientController', [
    '$scope', '$http', 'title','patient','update', 'close',
    function ($scope, $http, title, patient, update, close) {

        $scope.update = update

        $scope.patientForm = {
            $class: "nz.ac.auckland.Patient",
            id: "string",
            birthDate: "string",
            deathDate: "string",
            prefix: "string",
            first: "string",
            last: "string",
            ethinicity: "string",
            gender: "string",
            address: "string",
            publicKey: "string",
            consentedHPs: []
        }

        $scope.privateKey
        $scope.patientKey
        
        if (patient != null) {
            for (var key in patient) {
                if ($scope.patientForm.hasOwnProperty(key)) {
                    $scope.patientForm[key] = patient[key]
                }

            }
        }

        $scope.updatePatient = function () {
            var endpoint = apiBaseURL + "Patient/" + $scope.patientForm.id 
            $scope.endpoint = endpoint
            patientForm = Object.assign({}, $scope.patientForm)
            delete patientForm.id
            encryptForm(patientForm)
            $http({
                method: 'PUT',
                url: endpoint,
                data: angular.toJson(patientForm),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(_success, _error)
        }


        $scope.submitPatient = function () {
            var endpoint = apiBaseURL + "Patient"
            $scope.endpoint = endpoint

            keys = generateRSAkeys()

            patientForm = Object.assign({}, $scope.patientForm)
            patientForm.publicKey = keys.publicKey
            $scope.privateKey = keys.privateKey
            $http({
                method: 'POST',
                url: endpoint,
                data: angular.toJson(patientForm),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(response) {
                $scope.patientKey = generateRandomKey()
                $scope.viewData(response.data);
                $scope.close()
            }, _error)
        }

        function encryptForm(form) {
            // var keys = Object.keys(form)
    
            // keys.forEach(function (key) {
            //     if (!(key == "$class" || key == "id")) {
            //         var encryptedData = symEncrypt(form[key])
            //         encryptedData = JSON.parse(encryptedData)
            //         form[key] = encryptedData.ct
            //     }
    
            // })
            // console.log(form)
        }

        //  This close function doesn't need to use jQuery or bootstrap, because
        //  the button has the 'data-dismiss' attribute.
        $scope.close = function () {
            close({
                patientKey: $scope.patientKey,
                privateKey: $scope.privateKey
            }, 500); // close, but give 500ms for bootstrap to animate
        };


        /**
         * Show response message in a pop-up dialog box
         *
         * @param response
         * @private
         */
        function _success(response) {
            $scope.close()
            alert("Operation successful")
        }

        /**
         * Show error message in a pop-up dialog box
         *
         * @param response
         * @private
         */
        function _error(response) {
            $scope.close()
            alert("Error")
        }

        $scope.viewData = function (data) {

            $('#json-renderer').jsonViewer(data, { collapsed: true });
    
        }

        //  This cancel function must use the bootstrap, 'modal' function because
        //  the doesn't have the 'data-dismiss' attribute.
        // $scope.cancel = function () {

        //     //  Manually hide the modal.
        //     $element.modal('hide');

        //     //  Now call close, returning control to the caller.
        //     close({
        //         name: $scope.name,
        //         age: $scope.age
        //     }, 500); // close, but give 500ms for bootstrap to animate
        // };

    }]);