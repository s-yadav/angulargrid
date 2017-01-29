import {Injectable} from '@angular/core';
import { Headers, Http, RequestOptions, Response } from '@angular/http';
import 'rxjs/add/operator/catch';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import {Router} from "@angular/router";
import 'rxjs/add/operator/map';

@Injectable()
export class FlickrService {
  constructor(private http:Http) {
      
  }
  private extractData(res: Response) {
    let body = res.json();
    return body;
  }
  public getData() {
    return this.http.get('/data/flickr.json',{}).map(this.extractData);
  }
}