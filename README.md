angulargrid
===========

Pinterest like responsive masonry grid system for angular

Demo url : http://ignitersworld.com/lab/angulargrid/demo1.html

##Usage
1. Include angulargrid.js
```html
    <script src="angulargrid.js"></script>
```

2. Inject the module on your app
```js
    var App = angular.module('demoApp', ['angularGrid']);
```

3. Use directive as attribute defining the model you want to listen
```html
    <ul angular-grid="pics">
        .....
        .....
    </ul>
```
#Example

*HTML*
```html
    <ul class="dynamic-grid" angular-grid="pics" grid-width="300" gutter-size="10" angular-grid-id="gallery" refresh-on-img-load="false" >
        <li data-ng-repeat="pic in pics" class="grid">
            <img src="{{pic.media.m}}" class="grid-img" data-actual-width = "{{pic.actualWidth}}"  data-actual-height="{{pic.actualHeight}}" />
        </li>
    </ul>
```

In above html angular-grid="pics" defines the model you want to listen, so here its listening for pics 
grid-width, gutter-size and refresh-on-img-load are otional configuration for angular grid.

*CSS*
```css    
    .dynamic-grid{
        position: relative;
        display: none;
    }

    .dynamic-grid.angular-grid{
        display: block;
    }

    .grid {
        border: 1px solid #cccccc;
        position: absolute;
        list-style: none;
        background: #ffffff;
        box-sizing: border-box;
        -moz-box-sizing : border-box;
        -webkit-transition: all 0.6s ease-out; 
        transition: all 0.6s ease-out; 
    }
    .grid-img {
        width: 100%;
        vertical-align: middle;
        -webkit-transition: opacity 0.6s ease-out;  
        transition: opacity 0.6s ease-out;
        background-color: #fff;
        opacity: 0; 
        visibility: hidden;
    }

    .grid-img.img-loaded{
        visibility: visible;
        opacity: 1;
    }
        
```

*JS*
```js
angular.module('demoApp', ['angularGrid'])
    .service('imageService',['$q','$http',function($q,$http){
        this.loadImages = function(){
            return $http.jsonp("https://api.flickr.com/services/feeds/photos_public.gne?format=json&jsoncallback=JSON_CALLBACK");
        };
    }])
    .controller('demo', ['$scope','imageService','angularGridInstance', function ($scope,imageService,angularGridInstance) {
       imageService.loadImages().then(function(data){
            data.data.items.forEach(function(obj){
                var desc = obj.description,
                    width = desc.match(/width="(.*?)"/)[1],
                    height = desc.match(/height="(.*?)"/)[1];
                
                obj.actualHeight  = height;
                obj.actualWidth = width;
            });
           $scope.pics = data.data.items;
           
           $scope.refresh = function(){
                angularGridInstance.gallery.refresh();
           }
        });;
    }]);
```

##Options (attributes)
**grid-width** : (Default to 250) minimum width in pixel a coloumn can have, coloumn width will increase above grid width depending on container size to make grids responsive.

**gutter-size** : (Default to 10) Spacing between two column

**refresh-on-img-load** : (Default to true) refresh the layout on image load so images does not overlap each other 

##Handeling Images
If your list contains any image inside, as it will load asynchronously, plugin refresh the layout and add following classes to list item and images, so you can handle transitions of image better,

**images :** 
image-loading : when an image is loading inside list item
image-loaded : when an image is loaded inside list item

**list item :**
image-loading : when any of image is loading inside list item
image-loaded : when all images are loaded inside list item

Optionally if you know dimension of images you can add data-actual-width and data-actual-height attributes, so that it will not refresh the layout when those images are loaded.

##Refreshing manually
To get the refrence of instance you need to define angular-grid-id on the element which you can get back by injecting angularGridInstance to any controller or directive. 
Using your id you can refresh your layout ex : angularGridInstance.gallery.refresh();
