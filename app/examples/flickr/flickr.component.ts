import { FlickrService } from './flickr.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'my-app',
  template: `
    <style>
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
            overflow: hidden;
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
    </style>
    <ul [infiniteScroll]="loadMore" [performantScroll]="true" class="dynamic-grid" [angularGrid]="pics" [gridWidth]="300" [gutterSize]="10" [agId]="'gallery'" [refreshOnImageLoad]="false" >
        <li *ngFor="let pic of pics" class="grid" data-ng-clock>
            <img src="{{pic.media.m}}" class="grid-img" attr.data-actual-width = "{{pic.actualWidth}}"  attr.data-actual-height="{{pic.actualHeight}}" />
        </li>
    </ul>
    <
  `,
})
export class Flickr implements OnInit{
  constructor(private flickrService: FlickrService) {
  }
  pics:any = [];
  loadMore = ()=> {
      console.log("LOAD MORE");
      this.flickrService.getData().subscribe((data:any)=> {
      data.items.forEach(function(obj:any){
          let desc = obj.description,
              width = desc.match(/width="(.*?)"/)[1],
              height = desc.match(/height="(.*?)"/)[1];
          obj.actualHeight  = height;
          obj.actualWidth = width;
      });
      this.pics = [...this.pics, ...data.items];
    },(error:any)=> {
      console.log(error);
    })
  }
  ngOnInit() {
    this.flickrService.getData().subscribe((data:any)=> {
      data.items.forEach(function(obj:any){
          let desc = obj.description,
              width = desc.match(/width="(.*?)"/)[1],
              height = desc.match(/height="(.*?)"/)[1];
          obj.actualHeight  = height;
          obj.actualWidth = width;
      });
      this.pics = data.items;
      console.log(this.pics);
    },(error:any)=> {
      console.log(error);
    })
  }
}
