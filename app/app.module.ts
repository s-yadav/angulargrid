import { HttpModule } from '@angular/http';
import { FlickrService } from './examples/flickr/flickr.service';
import { Flickr } from './examples/flickr/flickr.component';
import { AngularGridDirective } from './angularGrid/angularGridDirective';
import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


@NgModule({
  imports:      [ BrowserModule, HttpModule ],
  declarations: [ Flickr, AngularGridDirective],
  providers: [FlickrService],
  bootstrap:    [ Flickr ]
})
export class AppModule { }
