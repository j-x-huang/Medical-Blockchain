<<<<<<< HEAD
var app = angular.module("myApp");
var endpoint = HP_ENDPOINT + "queries/";

app.controller("recordsController", [
  "$scope",
  "$element",
  "$http",
  "patient",
  "patientKey",
  "close",
  function($scope, $element, $http, patient, patientKey, close) {
    $scope.allergy = [];
    $scope.cond = [];
    $scope.imm = [];
    $scope.med = [];
    $scope.obs = [];
    $scope.proc = [];

    getRecords(
      endpoint +
        "selectAllAllergyRecords?p=resource%3Anz.ac.auckland.Patient%23" +
        patient.id,
      $scope.allergy
    );
    getRecords(
      endpoint +
        "selectAllConditionRecords?p=resource%3Anz.ac.auckland.Patient%23" +
        patient.id,
      $scope.cond
    );
    getRecords(
      endpoint +
        "selectAllImmunizationRecords?p=resource%3Anz.ac.auckland.Patient%23" +
        patient.id,
      $scope.imm
    );
    getRecords(
      endpoint +
        "selectAllMedicationRecords?p=resource%3Anz.ac.auckland.Patient%23" +
        patient.id,
      $scope.med
    );
    getRecords(
      endpoint +
        "selectAllObservationRecords?p=resource%3Anz.ac.auckland.Patient%23" +
        patient.id,
      $scope.obs
    );
    getRecords(
      endpoint +
        "selectAllProcedureRecords?p=resource%3Anz.ac.auckland.Patient%23" +
        patient.id,
      $scope.proc
    );

    function getRecords(query, array) {
      $http.get(query).then(function(response) {
        var tempArray = response.data;

        tempArray.forEach(function(form) {
          decryptForm(form);
        });

        console.log(tempArray);

        array.push.apply(array, tempArray);
        console.log(array);
      }, _error);
    }

    function _error(response) {
      console.log(response);
      $scope.close();
      alert("Error");
    }

    function decryptForm(form) {
      var keys = Object.keys(form);

      keys.forEach(function(key) {
        if (
          !(
            key == "$class" ||
            key == "id" ||
            key == "patient" ||
            key == "healthProvider"
          )
        ) {
          var decryptedData = symDecrypt(form[key], patientKey);
          form[key] = decryptedData;
        }
      });
    }

    $scope.refresh = function() {
      console.log($scope.allergy);
      console.log($scope.cond);
      console.log($scope.imm);
      console.log($scope.med);
      console.log($scope.obs);
      console.log($scope.proc);
    };

    //  This close function doesn't need to use jQuery or bootstrap, because
    //  the button has the 'data-dismiss' attribute.
    $scope.close = function() {
      close({}, 500); // close, but give 500ms for bootstrap to animate
    };

    //  This cancel function must use the bootstrap, 'modal' function because
    //  the doesn't have the 'data-dismiss' attribute.
    $scope.cancel = function() {
      //  Manually hide the modal.
      $element.modal("hide");

      //  Now call close, returning control to the caller.
      close({}, 500); // close, but give 500ms for bootstrap to animate
    };
  }
]);
=======
var app = angular.module('myApp')
var endpoint = HP_ENDPOINT + "queries/"
console.log("endpoint1: " + endpoint)


app.controller('recordsController', [
    '$scope', '$element', '$http', 'patient', 'patientKey', 'close',
    function ($scope, $element, $http, patient, patientKey, close) {

        $scope.allergy=[]
        $scope.cond=[]
        $scope.imm=[]
        $scope.med=[]
        $scope.obs=[]
        $scope.proc=[]

        console.log(HP_ENDPOINT)
        console.log(endpoint)

        getRecords(endpoint + "selectAllAllergyRecords?p=resource%3Anz.ac.auckland.Patient%23" + patient.id, $scope.allergy)
        getRecords(endpoint + "selectAllConditionRecords?p=resource%3Anz.ac.auckland.Patient%23" + patient.id, $scope.cond)
        getRecords(endpoint + "selectAllImmunizationRecords?p=resource%3Anz.ac.auckland.Patient%23" + patient.id, $scope.imm)
        getRecords(endpoint + "selectAllMedicationRecords?p=resource%3Anz.ac.auckland.Patient%23" + patient.id, $scope.med)
        getRecords(endpoint + "selectAllObservationRecords?p=resource%3Anz.ac.auckland.Patient%23" + patient.id, $scope.obs)
        getRecords(endpoint + "selectAllProcedureRecords?p=resource%3Anz.ac.auckland.Patient%23" + patient.id, $scope.proc)


        function getRecords(query, array) {
            $http.get(query).then(function(response) {

                console.log(query)
                console.log(array)
                var tempArray= response.data

                tempArray.forEach(function (form) {
                    decryptForm(form)
                })

                console.log(tempArray)

                array.push.apply(array,tempArray)
            }, _error);
        }

        function _error(response) {
            console.log(response)
            $scope.close()
            alert("Error: " + response.data.error.message);
        }

        function decryptForm(form) {
            var keys = Object.keys(form)
    
            keys.forEach(function (key) {
                if (!(key == "$class" || key == "id" || key == "patient" || key == "healthProvider")) {
                    console.log(patientKey)
                    var decryptedData = symDecrypt(form[key], patientKey)
                    form[key] = decryptedData
                }
            })
        }

        $scope.refresh = function () {
            console.log($scope.allergy);
            console.log($scope.cond);
            console.log($scope.imm);
            console.log($scope.med);
            console.log($scope.obs);
            console.log($scope.proc);
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
>>>>>>> 7aead9819f49e23a8a7fd53914f0a3da9961da2d
