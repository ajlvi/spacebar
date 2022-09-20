import { AfterContentInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ColorService } from './color-defintion.service';
import { GameService } from './game.service';
import { GridService } from './grid-service';
import { ResultsSharingService } from './results-sharing.service';
import { SecretIndexService } from './secret-index.service';
import { WritingService } from './writing.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [
    GameService, 
    SecretIndexService, 
    ResultsSharingService, 
    ColorService,
    WritingService]
})
export class AppComponent implements OnInit {
  @ViewChild('keyboardholder', {static:true}) keyboardbox: ElementRef;

  title = '5pace6ar';
  guessList: string[];
  gameFinished = false;
  seen_tutorial = false;
  display_stats = false;
  decidedOnCookies = false;
  displayMessage: string = '';
  allowsCookies: boolean
  rows = [0,1,2,3,4,5,6,7];
  keyboardWidth: string;
  
  constructor(
    private gameService: GameService, 
    private writingService: WritingService,
    private gridService: GridService) {}

  ngOnInit(): void {
    this.allowsCookies = this.writingService.areCookiesAllowed();
    if (this.allowsCookies) { 
      this.decidedOnCookies = true;
      this.seen_tutorial = true;
    }

    this.broadcastBoxSize(document.documentElement.clientWidth, document.documentElement.clientHeight);
    this.keyboardWidth = Math.min(window.innerWidth, 564) + "px";

    this.guessList = this.gameService.getAllGuesses();
    this.gameService.guessSubject.subscribe(
      (response: [string[], boolean]) => {
        const wasGameFinished = this.gameFinished;
        this.guessList = response[0];
        this.gameFinished = response[1];
        if (!wasGameFinished && this.gameFinished) {
          if (this.gameService.wonGame()) { 
            this.showMessage("Splendid!", 1500) 
          }
          else {
            this.showMessage(this.gameService.getAnswer(), 10000)
          }
          setTimeout( () => {
            this.seen_tutorial=true; this.display_stats = true;
          }, 1500 );
        }
      }
    )
  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(ev:KeyboardEvent) {
      if (this.seen_tutorial && !this.display_stats) {
        this.gameService.handleCharacter(ev.key);
      }
  }

  @HostListener('window:resize')
  onResize() {
    const windowWidth = document.documentElement.clientWidth;
    const windowHeight = document.documentElement.clientHeight;
    this.keyboardWidth = Math.min(windowWidth, window.innerWidth, 564) + "px";
    this.gridService.determineBoxSize(windowWidth, windowHeight)
    // console.log("Viewport size: " + document.documentElement.clientWidth + " x " + document.documentElement.clientHeight);
  }

  broadcastBoxSize(width: number, height: number) {
    this.gridService.determineBoxSize(width, height)
  }

  onCompletedTutorial() {
    this.seen_tutorial = true;
  }

  onCloseStats() {
    this.display_stats = false;
  }

  handleOverlay(option: string) {
    if (option === "tutorial") {
      this.seen_tutorial = false;
    }
    else if (option === "stats") {
      this.display_stats = true;
    }
  }

  cookieDecision(decision: boolean) {
    this.decidedOnCookies = true;
    if (decision) { this.gameService.cookieNowAccepted(); }
  }

  showMessage(msg: string, timeInMs: number) {
    this.displayMessage = msg;
    setTimeout( () => {this.displayMessage = '';}, timeInMs )
  }

}
