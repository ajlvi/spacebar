import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ColorDict, ColorService } from '../color-defintion.service';
import { GameService } from '../game.service';
import { GridService } from '../grid-service';
import { GuessData } from '../guessdata.model';
import { ResponseData } from '../response.model';

@Component({
  selector: 'app-game-row',
  templateUrl: './game-row.component.html',
  styleUrls: ['./game-row.component.css']
})
export class GameRowComponent implements OnInit, OnDestroy {
  @Input() row: number;
  letters: string[];
  guessSub: Subscription;
  responseSub: Subscription;

  palette: ColorDict;
  colorSub: Subscription;

  boxSub: Subscription;
  boxSide = "52px";

  amActive = false;
  amLegal = true;
  colors = ['white', 'white', 'white', 'white', 'white', 'white'];
  backgrounds =  ['white', 'white', 'white', 'white', 'white', 'white'];

  constructor(
    private gameService: GameService, 
    private colorService: ColorService,
    private gridService: GridService) { }

  ngOnInit() {
    this.letters = ['', '', '', '', '', ''];
    this.amActive = this.gameService.getGuessNumber() === this.row;
    this.palette = this.colorService.getCurrentColors();
    this.updateColors();
    this.guessSub = this.gameService.activeSubject.subscribe(
      (data: GuessData) => {
        this.amActive = (this.row === data.row);
        if (this.amActive) {
          this.letters = data.letters;
        }
      }
    )
    this.boxSide = this.gridService.getGridBoxSize();
    this.boxSub = this.gridService.boxSizeSubject.subscribe(
      (size: string) => {
        this.boxSide = size;
      }
    )
    //we got response data as colors. we log these, then convert based on our palette.
    this.responseSub = this.gameService.responseSubject.subscribe(
      (data: ResponseData) => {
        if (this.amActive) {
          this.amLegal = data.valid;
          this.colors = data.colors;
          for (let i=0; i< this.colors.length; i++) {
            this.backgrounds[i] = this.palette[this.colors[i]];
          }
        }
      }
    )
    // colorSub firing means we toggled the palette. update our colors.
    this.colorSub = this.colorService.colorSubject.subscribe(
      (data: ColorDict) => {
        this.palette = data;
        this.updateColors();
      }
    )
  }

  updateColors() {
    for (let i=0; i< this.colors.length; i++) {
      this.backgrounds[i] = this.palette[this.colors[i]];
    }
  }

  ngOnDestroy(): void {
    this.guessSub.unsubscribe();
    this.responseSub.unsubscribe();
    this.colorSub.unsubscribe();
    this.boxSub.unsubscribe();
  }

  borderColor() {
    if (!this.amLegal) { return this.palette["red"] }
    else { return this.palette["black"] }
  }

}
