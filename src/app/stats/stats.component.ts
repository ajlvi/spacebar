import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subscription, timestamp } from 'rxjs';
import { ColorDict, ColorService } from '../color-defintion.service';
import { GameService } from '../game.service';
import { SecretIndexService } from '../secret-index.service';
import { WritingService } from '../writing.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, OnDestroy {
  @Output() doneViewing = new EventEmitter<boolean>();
  @ViewChild('statsOverlay', {static:true}) statsBox: ElementRef;

  palette: ColorDict;
  guessBarBack: string;
  activeBarBack: string;
  acceptedCookie: boolean;

  timeSub: Subscription;
  timeLeft: number;
  hours: number;
  minutes: number;
  seconds: number;
  timeToNextGame: string;

  guessHisto: number[]; 
  cumulativeStats: number[]; // receive total, won, streak, longest, reds, pct

  gameFinished = false;
  activeRow: number;
  
  constructor(
    private colorService: ColorService, 
    private gameService: GameService,
    private writingService: WritingService,
    private secretService: SecretIndexService
  ) { }

  ngOnInit(): void {
    this.palette = this.colorService.getCurrentColors();
    this.updateColors();

    this.guessHisto = this.writingService.getDistribution();
    this.cumulativeStats = this.writingService.getTotals();
    this.acceptedCookie = this.writingService.areCookiesAllowed();

    this.gameFinished = this.gameService.gameOver();
    if (this.gameFinished) {
      this.activeRow = this.gameService.getAllGuesses().length - 1;
    }

    if (this.secretService.isReady() && this.gameFinished) {
      this.processTime( this.secretService.getRemainingTime() );
    }
    else {
      this.timeSub = this.secretService.timeSubject.subscribe( 
        (netTime: number) => {
        if (this.gameFinished) { this.processTime(netTime); }
      }
    )}
  }

  ngOnDestroy(): void {
    if (!this.timeSub === undefined) {this.timeSub.unsubscribe();}
  }

  processTime(remainingTime: number) {
    this.timeLeft = remainingTime;
    setInterval( () => {
      this.timeLeft--;
      if (this.timeLeft <= 0) { return "0:00:00"; }
      this.hours = Math.floor(this.timeLeft/3600);
      this.minutes = Math.floor( (this.timeLeft - 3600*this.hours) / 60) ;
      this.seconds = this.timeLeft - 3600* this.hours - 60*this.minutes;
      this.timeToNextGame = 
        this.hours.toString() + ":" +
         ("0" + this.minutes.toString()).slice(-2) + ":" +
         ("0" + this.seconds.toString()).slice(-2);
    }, 1000)
  }

  updateColors() {
    if (this.palette.theme === "dark") {
      this.statsBox.nativeElement.classList.add("dark-theme");
    }
    else if (this.palette.theme === "light") {
      this.statsBox.nativeElement.classList.remove("dark-theme");
    }
    this.activeBarBack = this.palette["green"]
    this.guessBarBack = this.palette["blue"]
  }

  determineWidth(i: number) {
    let largest = Math.max(...this.guessHisto)
    let percentage = Math.round( (90 * this.guessHisto[i])/largest )
    return percentage.toString() + "%"
  }

  onClose() {
    this.doneViewing.emit(true);
  }

  onShare() {
    this.gameService.copyResultsToClipboard();
  }

  onAcceptCookie() {
    this.gameService.cookieNowAccepted();
    this.acceptedCookie = true;
  }
  
  @HostListener('document:click', ['$event']) onClickOut(event: Event) {
    if (!this.statsBox.nativeElement.contains(event.target) &&
        !(event.target["id"] === "StatsOpener") &&
        !(event.target["id"] === "CookieAcceptButton") &&
        !(event.target["id"] === "CookieRejectButton") &&
        !(event.target["id"] === "AcceptCookieButton")) {
      this.onClose();
    }
  }

}
