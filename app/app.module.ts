import { HttpModule } from '@angular/http';
import { FlickrService } from './examples/flickr/flickr.service';
import { Flickr } from './examples/flickr/flickr.component';
import { InfiniteScrollDirective } from './ng2-grid/ng2directive';
import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


@NgModule({
  imports:      [ BrowserModule, HttpModule ],
  declarations: [ Flickr, InfiniteScrollDirective],
  providers: [FlickrService],
  bootstrap:    [ Flickr ]
})
export class AppModule { }
