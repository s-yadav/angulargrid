angular.module('demoApp', ['angularGrid'])
    .service('imageService',['$q','$http',function($q,$http){
        this.loadImages = function(){
            return $http.jsonp("https://api.flickr.com/services/feeds/photos_public.gne?format=json&jsoncallback=JSON_CALLBACK");
        };
    }])
    .controller('demo', ['$scope','imageService', function ($scope,imageService) {
       imageService.loadImages().then(function(data){
            $scope.pics = data.data.items;
           //console.log($scope.pics);
        });;
    }]);