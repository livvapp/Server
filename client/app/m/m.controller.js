'use strict';

angular.module('v5App')
  .controller('MCtrl', function ($scope, $http, $stateParams) {
    $scope.lat = '';
    $scope.lon = '';
    $http.get('http://10.0.1.10:9000/api/links/'+$stateParams.id)
    .success( function(response) {
      console.log(response);
      $scope.lat = response.lat;
      $scope.lon = response.lon;

      // JQUERY
      L.mapbox.accessToken = 'pk.eyJ1IjoibGlhbWNhcmRlbmFzIiwiYSI6InE3Yk1rVXcifQ.Rf8vPSZk565xLzVRwlx_MA';
      var map = L.mapbox.map('map', 'examples.map-i86nkdio')
          .setView([$scope.lat, $scope.lon], 19);
      var fixedMarker = L.marker(new L.LatLng($scope.lat, $scope.lon), {
          icon: L.mapbox.marker.icon({
              'marker-color': '000000'
          })
      }).addTo(map);
      // END JQUERY



    })

    $scope.message = 'Hello';
    console.log($stateParams.id);
  });
