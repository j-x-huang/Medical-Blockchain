var app = angular.module('myApp');

app.controller('recordsController', [
  '$scope', '$element', 'patient', 
  function($scope, $element, patient) {

    $scope.records = patient.records
  
  //  This close function doesn't need to use jQuery or bootstrap, because
  //  the button has the 'data-dismiss' attribute.
  $scope.close = function() {
 	  close({
    }, 500); // close, but give 500ms for bootstrap to animate
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