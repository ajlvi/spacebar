import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import $ from 'jquery';

@Injectable()
export class SecretIndexService {
  private dayNum: number; 
  private timeOffset: number;
  private daylightSavingsOffset: number;
  private ready = false;
  indexSubject = new Subject<number>;
  dateSubject = new Subject<number>;
  timeSubject = new Subject<number>;

  constructor(private http: HttpClient) {
    //we use worldtimeapi to get internet time, then note the time offset.
    //then we can use local time in the future, offsetting accordingly.
    // console.log(this.getServerTime(), new Date(this.getServerTime()));
    let serverDate = this.getServerTime()
    let localDate = new Date();
    let serverTime = new Date(serverDate).getTime()
    let localTime = localDate.getTime()
    this.timeOffset = Math.floor( (serverTime - localTime)/1000)
    console.log("offset: " + (serverTime - localTime) )
    this.daylightSavingsOffset = this.NYCTimeZoneOffset(serverDate);
    this.dayNum = Math.floor( (serverTime/1000 - this.daylightSavingsOffset)/86400);
    console.log("dayNum: " + (serverTime/1000 - this.daylightSavingsOffset)/86400)
    this.ready = true;
    this.dateSubject.next(this.dayNum);
    this.timeSubject.next(this.getRemainingTime())
    this.indexSubject.next(this.generateSecretIndex());

      // this.http.get('http://worldtimeapi.org/api/timezone/America/New_York').subscribe(
      //   (res) => {
      //     let netTime = res["unixtime"];
      //     let localTime = Math.floor(new Date().getTime()/1000)
      //     this.timeOffset = netTime - localTime;
      //     if ( res["utc_offset"] === "-04:00" ) {
      //       this.daylightSavingsOffset = 14400;
      //     }
      //     else if ( res["utc_offset"] === "-05:00" ) {
      //       this.daylightSavingsOffset = 18000;
      //     }
      //     else { 
      //       throw new RangeError("UTC offset is not -4 or -5"); 
      //     }
      //     //day number is based on NYC time, so we adjust the timezone offset.
      //     console.log( (netTime - this.daylightSavingsOffset)/86400)
      //     this.dayNum = Math.floor( (netTime - this.daylightSavingsOffset)/86400)
      //     this.ready = true;
      //     this.dateSubject.next(this.dayNum);
      //     this.timeSubject.next(this.getRemainingTime());
      //     this.indexSubject.next(this.generateSecretIndex());
      //   }
      //  );
  }

  getServerTime() {
    return $.ajax({async: false}).getResponseHeader( 'Date' );
  }

  NYCTimeZoneOffset(serverDate: string): number {
    let serverDateObj = new Date(serverDate)
    if (serverDateObj.getFullYear() === 2022 &&
      serverDateObj.getMonth() === 10 &&
      serverDateObj.getDate() >= 6)
      {return 5*60*60;}
    else if (serverDateObj.getFullYear() === 2023 &&
      serverDateObj.getMonth() === 2 &&
      serverDateObj.getDate() <= 11 )
      {return 5*60*60;}
    else if (serverDateObj.getFullYear() === 2023 &&
      serverDateObj.getMonth() === 10 &&
      serverDateObj.getDate() >= 5 )
      {return 5*60*60;}
    else if (serverDateObj.getMonth() === 11)
      {return 5*60*60;}
    else if (serverDateObj.getMonth() <= 1)
      {return 5*60*60;}
    else {return 4*60*60;}
  }

  isReady(): boolean {return this.ready}

  getRemainingTime(): number {
    let netTime = Math.floor( new Date().getTime()/1000 ) + this.timeOffset - this.daylightSavingsOffset;
    return 86400 - ( (netTime) % (86400) ) ;
  }

  //this is from a StackExchange response:
  //https://stackoverflow.com/questions/5989429/pow-and-mod-function-optimization
  expmod( base: number, exp: number, mod: number ){
      if (exp == 0) return 1;
      if (exp % 2 == 0){
        return Math.pow( this.expmod( base, (exp / 2), mod), 2) % mod;
      }
      else {
        return (base * this.expmod( base, (exp - 1), mod)) % mod;
      }
    }

  private p = 3307 //this is the length of the target_six list.

  generateSecretIndex(): number {
      return this.expmod(this.dayNum % this.p, 5, this.p)
    }

  getDayNum(): number { return this.dayNum; }
}