angulargrid
===========

Wookmark and pin-interest like dynamic grid system for angular

**** Under Development ****

*Example HTML Format*
```html
    <ul class="dynamic-grid" angular-grid="pics" grid-width="250" gutter-size="20">
        <li data-ng-repeat="pic in pics" class="grid">
            <img src="{{pic.media.m}}" class="grid-img"/>
        </li>
    </ul>
```

In above html angular-grid="pics" defines the model you want to listen, so here its listening for pics 
grid-width and gutter-size are otional configuration for angular grid.

*CSS*
```css
  .grid {
      border: 1px solid #cccccc;
      position: absolute;
      list-style: none;
      -webkit-box-shadow: 1px 1px 2px 0px rgba(50, 50, 50, 0.3);
      -moz-box-shadow: 1px 1px 2px 0px rgba(50, 50, 50, 0.3);
      box-shadow: 1px 1px 2px 0px rgba(50, 50, 50, 0.3);
      background: #ffffff;
  }
  .grid-img {
      width: 100%;
      vertical-align: middle;
  }
  .grid-img.img-loading {
      display: none;
  }
```

#Options
gridWidth : (Default to 250) minimum width in pixel a coloumn can have, coloumn width will increase above grid width depending on container size to make grids responsive.

gutterSize : (Default to 10) Spacing between two column
