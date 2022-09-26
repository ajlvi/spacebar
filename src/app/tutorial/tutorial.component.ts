import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ColorDict, ColorService } from '../color-defintion.service';
import { GridService } from '../grid-service';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.css']
})
export class TutorialComponent implements OnInit, OnDestroy {
  @Output() doneViewing = new EventEmitter<boolean>();
  @ViewChild('tutorialOverlay', {static:true}) tutorialBox: ElementRef;
  palette: ColorDict;
  colorSub: Subscription;
  tutorialBackgrounds: string[];
  backgroundOne = ["yellow", "white", "white", "green", "white", "white", "red", "black"];
  backgroundHex: string[] = [];

  constructor(private colorService: ColorService) { }

  ngOnInit(): void {
    //will need to be updated to receive cookie information
    this.palette = this.colorService.getCurrentColors();
    this.updateColors()
    this.colorSub = this.colorService.colorSubject.subscribe(
      (data: ColorDict) => {
        this.palette = data;
        this.updateColors()
      }
    )
    if (this.tutorialBox.nativeElement.clientWidth <= 340) {
      this.tutorialBox.nativeElement.classList.add("thinner");
    }
    else if (this.tutorialBox.nativeElement.clientWidth <= 400) {
      this.tutorialBox.nativeElement.classList.add("thin");
    }
  }

  updateColors() {
    let newBackgrounds = [];
    for (let i=0; i< this.backgroundOne.length; i++) {
      newBackgrounds.push(this.palette[this.backgroundOne[i]])
    }
    this.backgroundHex = newBackgrounds;
    if (this.palette.theme === "dark") {
      this.tutorialBox.nativeElement.classList.add("dark-theme");
    }
    else if (this.palette.theme === "light") {
      this.tutorialBox.nativeElement.classList.remove("dark-theme");
    }
  }

  ngOnDestroy(): void {
    this.colorSub.unsubscribe();
  }

  onClose() {
    this.doneViewing.emit(true);
  }

  @HostListener('document:click', ['$event']) onClickOut(event: Event) {
    if (!this.tutorialBox.nativeElement.contains(event.target) &&
        !(event.target["id"] === "TutorialOpener") &&
        !(event.target["id"] === "CookieAcceptButton") &&
        !(event.target["id"] === "CookieRejectButton")) {
      this.onClose();
    }
  }
}
