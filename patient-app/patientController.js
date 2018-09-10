var app = angular.module('myApp');
var apiBaseURL = "http://localhost:3000/api/";

app.controller('PatientController', [
    '$scope', '$http', 'title','patient','update', 'close',
    function ($scope, $http, title, patient, update, close) {

        $scope.update = update

        $scope.patientForm = {
            $class: "nz.ac.auckland.Patient",
            id: "",
            birthDate: "",
            deathDate: "",
            prefix: "",
            first: "",
            last: "",
            ethinicity: "",
            gender: "",
            address: "",
            publicKey: "",
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
            dateToString(patientForm)
            //encryptForm(patientForm)
            $http({
                method: 'PUT',
                url: endpoint,
                data: angular.toJson(patientForm),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(_success, _error)
        }

        function dateToString(form) {
            var keys = Object.keys(form)
    
            keys.forEach(function (key) {
                if (form[key] instanceof Date) {
                    form[key] = form[key].toLocaleDateString('en-GB')
                }
            })
            console.log(form)
        }


        $scope.submitPatient = function () {
            //
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
            $scope.viewData(response.data);
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