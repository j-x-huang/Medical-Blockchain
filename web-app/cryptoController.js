var app = angular.module('myApp');

app.controller('cryptoController', [
  '$scope', '$element', 'patientKey', 'privateKey', 
  function($scope, $element, patientKey, privateKey) {

  $scope.patientKey = patientKey;
  $scope.privateKey = privateKey;

  $scope.downloadSecret = function () {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent($scope.patientKey));
    element.setAttribute('download', "PatientKey.txt");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

$scope.downloadPrivate = function () {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent($scope.privateKey));
    element.setAttribute('download', "PrivateKey.pem");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
  
  //  This close function doesn't need to use jQuery or bootstrap, because
  //  the button has the 'data-dismiss' attribute.
  $scope.close = function() {
    var isConfirmed = confirm("By closing the modal you will never see the keys again. Are you sure you want to continue?")

    if (isConfirmed) {
      close({
      }, 500); // close, but give 500ms for bootstrap to animate
    }
  };

  //  This cancel function must use the bootstrap, 'modal' function because
  //  the doesn't have the 'data-dismiss' attribute.
  $scope.cancel = function() {

    //  Manually hide the modal.
    $element.modal('hide');
    
    //  Now call close, returning control to the caller.
    close({

    }, 500); // close, but give 500ms for bootstrap to animate
  };

}]);