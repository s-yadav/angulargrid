var app = angular.module('app', ['ngMaterial','angularGrid']);

app.controller('MainCtrl', function($scope, $http, $q) {
  var vm = this;
  $scope.card = {};
  $scope.card.title = 'test';
  vm.page = 0;
  vm.shots = [];
  vm.loadingMore = false;

  vm.loadMoreShots = function() {

    if(vm.loadingMore) return;
    vm.page++;
    // var deferred = $q.defer();
    vm.loadingMore = true;
    var promise = $http.get('https://api.dribbble.com/v1/shots/?per_page=24&page='+vm.page+'&access_token=3df6bcfc60b54b131ac04f132af615e60b0bd0b1cadca89a4761cd5d125d608f');
    promise.then(function(data) {

      var shotsTmp = angular.copy(vm.shots);
      shotsTmp = shotsTmp.concat(data.data);
      vm.shots = shotsTmp;
      vm.loadingMore = false;

    }, function() {
      vm.loadingMore = false;
    });
    return promise;
  };

  vm.loadMoreShots();

});
app.filter('unsafe', function($sce) { return $sce.trustAsHtml; });
