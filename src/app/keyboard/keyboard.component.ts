import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { BackgroundData } from '../background-data.model';
import { GameService } from '../game.service';
import { ColorDict, ColorService } from '../color-defintion.service'

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.css']
})
export class KeyboardComponent implements OnInit, OnDestroy {

  backgroundDict: BackgroundData;
  backgroundHexCodes: BackgroundData;
  colorSubscription: Subscription;
  palette: ColorDict;
  paletteSubscription: Subscription;
  @ViewChild("spacebar", {static:true}) spacebarButton: ElementRef;

  constructor(private gameService: GameService,
              private colorService: ColorService) {}

  ngOnInit(): void {
    //later we should get the appropriate color palette from the cookie
    this.palette = this.colorService.getCurrentColors()
    this.backgroundDict = new BackgroundData(...new Array(26).fill("kwhite"))
    this.backgroundHexCodes = new BackgroundData(...new Array(26).fill(this.palette["kwhite"]))
    this.colorSubscription = this.gameService.keyboardColorSubject.subscribe(
      (data: BackgroundData) => {
        this.backgroundDict = data;
        for (let key in data) {
          this.backgroundHexCodes[key] = this.palette[data[key]];
        }
      }
    )
    this.paletteSubscription = this.colorService.colorSubject.subscribe(
      (data: ColorDict) => {
        this.palette = data; 
        for( let key in this.backgroundDict ) {
          this.backgroundHexCodes[key] = this.palette[this.backgroundDict[key]]
        }
      }
    )
  }

  onKeyboard(event: Event) {
    const divID = (event.target as Element).id;
    if (divID === "Space") { this.gameService.handleCharacter(" ") ; }
    else { this.gameService.handleCharacter(divID) ; }
    //we force focus onto the spacebar so that typing space doesn't repush the button
    this.spacebarButton.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.colorSubscription.unsubscribe();
  }

  specialButtonBackground(): string {
    return this.palette["kwhite"];
  }

}
