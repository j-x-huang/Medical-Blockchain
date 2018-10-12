var app = angular.module("myApp", [
  "angularModalService",
  "ngMaterial",
  "ngMessages",
  "ngWebsocket",
  "ngRoute"
]);
var apiBaseURL = HP_ENDPOINT;
var namespace = "nz.ac.auckland";
var endpoint2 = HP_ENDPOINT + "queries/";
var webport = HP_ENDPOINT.replace("/api/", "");
webport = webport.replace("http", "ws");

// Shared service
app.service("myService", function() {
  return {
    privateKey: "",
    id: "",
    details: undefined
  };
});

// Router
app.config(function($routeProvider) {
  $routeProvider
    .when("/", {
      templateUrl: "login.html",
      controller: "loginCtrl"
    })
    .when("/main", {
      templateUrl: "main.html",
      controller: "myCtrl",
      resolve: {
        check: function(myService, $location) {
          console.log(myService.id);
          if (
            myService.privateKey === "" ||
            myService.id === "" ||
            myService.id === undefined ||
            myService.details === undefined
          ) {
            $location.path("/"); //redirect user to home if it does not have permission.
            alert("Details are missing");
          }
        }
      }
    });
});

// Login Controller
app.controller("loginCtrl", function($scope, $http, $location, myService) {
  $scope.id;

  /**
   * handles uploading of files such as patient or private-public key
   */
  $scope.handleFiles = function(files) {
    var file = files[0];
    var reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = function() {
      var str = reader.result;

      console.log(file);
      console.log(file.type);

      var fileArray = file.name.split(".");
      var fileExtension = fileArray[fileArray.length - 1];

      if (
        file.type == "application/x-x509-ca-cert" ||
        fileExtension === "pem"
      ) {
        myService.privateKey = str;
        alert("Private key successfully submitted");
      } else {
        alert("Unable to read file");
      }
    };
  };

  // redirects to main screen
  $scope.login = function() {
    myService.id = $scope.id;
    var endpoint = apiBaseURL + "HealthProvider/" + myService.id;

    $http.get(endpoint).then(
      function(response) {
        myService.details = response.data;
        $location.path("/main");
      },
      function(res) {
        alert("Health Provider does not exist");
      }
    );
  };
});

// Main app controller
app.controller("myCtrl", function(
  $scope,
  $http,
  $websocket,
  ModalService,
  myService
) {

  // ------ Fields -----
  $scope.hid = myService.id;
  $scope.hpArray = myService.details;
  $scope.keyArray = [];

  $scope.patientTab = true;

  $scope.pid;
  $scope.patientKey;
  $scope.privateKey = myService.privateKey;
  let _login = true;
  $scope.notiIcon = false;

  $scope.notiArray = [];

  $scope.myArray = [];

  // ----- END FIELDS -----

  // ----- CRUD & TRANSACTIONS -----
  $scope.getPatients = function() {
    if (!isCredsProvided()) {
      return;
    }

    var endpoint = apiBaseURL + "Patient";

    $http.get(endpoint).then(function(response) {
      $scope.myArray = response.data;
    }, _error);
  };

  $scope.getMe = function() {
    var endpoint = apiBaseURL + "HealthProvider/" + $scope.hid;

    $http.get(endpoint).then(function(response) {
      $scope.hpArray = response.data;
      _login = true;
    }, _error);
  };

  $scope.reqKey = function() {
    if (!isCredsProvided()) {
      return;
    }

    var endpoint = apiBaseURL + "RequestRecordSharing";

    var reqForm = {
      $class: "nz.ac.auckland.RequestRecordSharing",
      patient: "resource:" + namespace + ".Patient#" + $scope.pid,
      healthProvider: "resource:" + namespace + ".HealthProvider#" + $scope.hid
    };

    $http({
      method: "POST",
      url: endpoint,
      data: angular.toJson(reqForm),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(_success, _error);
  };

  $scope.getKeys = function() {
    if (!isCredsProvided()) {
      return;
    }

    $scope.keyArray = [];

    var endpoint =
      endpoint2 +
      "selectPatientKeysByHealthProviderID?hp=resource%3Anz.ac.auckland.HealthProvider%23" +
      $scope.hid;

    $http.get(endpoint).then(function(response) {
      response.data.forEach(function(data) {
        var pLine = data.patient.split("#");

        var pid = pLine[1];
        var encryptedKey = data.encryptedPatientKeyHPPublic;

        var decryptedKey = $scope.tryDecrypt(encryptedKey);

        var keyOb = {
          id: pid,
          key: decryptedKey
        };

        $scope.keyArray.push(keyOb);
      });
    }, _error);
  };

  $scope.addRecord = function(index) {
    var id = $scope.myArray[index].id;

    ModalService.showModal({
      templateUrl: "./addRecordModal.html",
      controller: "addRecordController",
      preClose: modal => {
        modal.element.modal("hide");
      },
      inputs: {
        _id: id,
        hid: $scope.hid,
        privateKey: $scope.privateKey
      }
    }).then(function(modal) {
      modal.element.modal();
      modal.close.then(function(result) {
        $(".modal-backdrop").remove();
      });
    });
  };


  $scope.getId = function(index) {
    _id = $scope.myArray[index].id;
    _records = $scope.myArray[index].records;
  };

  // ----- END CRUD & TRANSACTIONS -----

  // ----- RESPONSE HANDLING -----
  /**
   * Show response message in a pop-up dialog box
   *
   * @param response
   * @private
   */
  function _success(response) {
    alert("Operation successful");
  }

  /**
   * Show error message in a pop-up dialog box
   *
   * @param response
   * @private
   */
  function _error(response) {
    console.log(response);
    alert("Error: " + response.data.error.message);
  }

  // ------ END RESPONSE HANDLING ------

  // ------ MODALS ------
  $scope.viewRecords = function(index) {
    if (!isCredsProvided()) {
      return;
    }
    var patientKey;

    var patient = $scope.myArray[index];

    var endpoint =
      endpoint2 +
      "selectPatientKeysByPatientID?p=resource%3Anz.ac.auckland.Patient%23" +
      patient.id;

    
    $http.get(endpoint).then(function(response) {
      console.log(response.data);
      if (response.data.length === 0) {
        alert("The patient has not shared a key with you");
        return;
      }

      var pKeyBody = response.data[0];
      var encryptedKey = pKeyBody.encryptedPatientKeyHPPublic;

      patientKey = $scope.tryDecrypt(encryptedKey);

      ModalService.showModal({
        templateUrl: "./recordsModal.html",
        controller: "recordsController",
        preClose: modal => {
          modal.element.modal("hide");
        },
        inputs: {
          title: "Patient Details",
          patient: patient,
          patientKey: patientKey
        }
      }).then(function(modal) {
        modal.element.modal();
        modal.close.then(function(result) {
          $(".modal-backdrop").remove();
        });
      });
    }, _error);
  };

  // ------ END MODALS ------
  // ------ WEB SOCKETS ------
  var ws = $websocket.$new(webport);

  ws.$on("$open", function() {
    // it listents for 'incoming event'
    console.log("WS Open");
  }).$on("$message", function(data) {
    console.log(data);
    if (data.$class === "nz.ac.auckland.ShareKeyNotification") {
      var pLine = data.patient.split("#");
      var pId = pLine[1];

      var timestamp = new Date(data.timestamp);

      var timeString =
        timestamp.toLocaleDateString("en-GB") +
        " @ " +
        timestamp.toLocaleTimeString("en-GB");

      var notification = {
        time: timeString,
        msg: "Patient #" + pId + " has shared their key with you"
      };
      $scope.notiIcon = true;
      $scope.notiArray.unshift(notification);
    } else if (
      data.$class === "nz.ac.auckland.RevokeMedicalRecordsSharingNotification"
    ) {
      var pLine = data.patient.split("#");
      var pId = pLine[1];

      var timestamp = new Date(data.timestamp);

      var timeString =
        timestamp.toLocaleDateString("en-GB") +
        " @ " +
        timestamp.toLocaleTimeString("en-GB");
      var notification = {
        time: timeString,
        msg: "Patient #" + pId + " is no longer sharing their key with you :("
      };
      $scope.notiIcon = true;
      $scope.notiArray.unshift(notification);
    }
    $scope.$apply();
  });
  // ----- END WEBSOCKETS -----


 // ----- MISCELLANEOUS ------
  function isCredsProvided() {
    if (!_login) {
      alert("Credentials not fully supplied");
      return false;
    }
    return true;
  }

  $scope.tryDecrypt = function(encryptedPkey) {
    return asymDecrypt(encryptedPkey, $scope.privateKey);
  };

  $scope.keyPress = function(value) {
    if (value.keyCode == 42) {
      ModalService.closeModals(null, 500);
    }
  };

  $scope.setTab = function(tag) {
    if (tag === "Patient") {
      $scope.getPatients();
    } else if (tag === "PatientKey") {
      $scope.getKeys();
    }
  };

  $scope.dismiss = function() {
    $scope.notiIcon = false;
  };
});
