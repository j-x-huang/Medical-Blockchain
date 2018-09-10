var app = angular.module('myApp')
var endpoint = "http://localhost:3000/api/queries/"

app.controller('addRecordController', [
    '$scope', '$element', '$http', '_id', 'patientKey', 'close',
    function ($scope, $element, $http, _id, patientKey, close) {

        $scope.recordForm = {
            $class: "nz.ac.auckland.Record",
            id: "",
            record_date: "",
            record_code: "",
            record_reasonCode: "",
            record_reasonDesc: "",
            healthProvider: "",
            patient: ""
        }

        $scope.allergyForm = {}
        $scope.procedureForm = {}
        $scope.observationForm = {}
        $scope.medicationForm = {}
        $scope.immunizationForm = {}
        $scope.conditionForm = {}

        $scope.selectedRecord = {}
        $scope.types = ["Allergy", "Procedure", "Observation", "Medication", "Immunization", "Condition"]

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
            recordForm = Object.assign({}, $scope.recordForm, recordForm)
            recordForm.$class = namespace + '.' + $scope.selectedRecord.type
            recordForm.patient = "resource:" + namespace + ".Patient#" + _id
            recordForm.healthProvider = "resource:" + namespace + ".HealthProvider#" + recordForm.healthProvider

            dateToString(recordForm)
            console.log(recordForm)

            encryptForm(recordForm)

            var endpoint = apiBaseURL + $scope.selectedRecord.type
            $scope.endpoint = endpoint

            clearFields()
            $http({
                method: 'POST',
                url: endpoint,
                data: angular.toJson(recordForm),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(_success, _error)
        }

        function clearFields() {
            $scope.recordForm = {
                $class: "nz.ac.auckland.Record",
                id: "",
                record_date: "",
                record_code: "",
                record_reasonCode: "",
                record_reasonDesc: "",
                healthProvider: "",
                patient: ""
            }
    
            $scope.allergyForm = {}
            $scope.procedureForm = {}
            $scope.observationForm = {}
            $scope.medicationForm = {}
            $scope.immunizationForm = {}
            $scope.conditionForm = {}
        }

        function encryptForm(form) {
            var keys = Object.keys(form)
    
            keys.forEach(function (key) {
                if (!(key == "$class" || key == "id" || key == "patient" || key == "healthProvider")) {
                    var encryptedData = symEncrypt(form[key], patientKey)
                    form[key] = encryptedData.toString()
                }
    
            })
    
            console.log(form)
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
            $scope.viewData(response.data)
            $scope.close()
            alert("Error")
        }

        //  This close function doesn't need to use jQuery or bootstrap, because
        //  the button has the 'data-dismiss' attribute.
        $scope.close = function () {
            close({
            }, 500); // close, but give 500ms for bootstrap to animate
        };

        //  This cancel function must use the bootstrap, 'modal' function because
        //  the doesn't have the 'data-dismiss' attribute.
        $scope.cancel = function () {

            //  Manually hide the modal.
            $element.modal('hide');

            //  Now call close, returning control to the caller.
            close({

            }, 500); // close, but give 500ms for bootstrap to animate
        };

    }]);