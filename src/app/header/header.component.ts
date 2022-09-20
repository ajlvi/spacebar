import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ColorDict, ColorService } from '../color-defintion.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('headcontainer', {static:true}) headBar: ElementRef;
  @Output() overlay = new EventEmitter<string>();
  currentColor = 'light';
  palette: ColorDict;
  colorSub: Subscription;
  viewportWidth = document.documentElement.clientWidth;
  viewportHeight = document.documentElement.clientHeight;

  constructor(private colors: ColorService) { }

  ngOnInit(): void {
    this.palette = this.colors.getCurrentColors();
    this.setColor(this.palette.theme);
    this.updateHeadBorder();
    this.colorSub = this.colors.colorSubject.subscribe(
      (data: ColorDict) => {
        this.palette = data;
        this.updateHeadBorder();
      }
    )
  }

  ngOnDestroy(): void {
    this.colorSub.unsubscribe();
  }

  updateHeadBorder() {
    if (this.palette.theme == "dark") {
      this.headBar.nativeElement.classList.add("dark-theme")
    }
    else {
      this.headBar.nativeElement.classList.remove("dark-theme")
    }
  }

  determineBorderColor() {
    return this.palette["black"];
  }

  determineBackgroundColor(element: string) {
    if (element == this.currentColor) {
      return this.palette["yellow"]
    }
    else { return this.palette["white"] }
  }

  // this method will get called (without toggleColor) when we read the cookie
  // otherwise we'll potentially emit the palette twice on startup
  setColor(option: string) {
    this.currentColor = option;
  }

  toggleColor(option: string) {
    this.setColor(option);
    this.colors.setColor(option);
  }

  openTutorial() {
    this.overlay.emit("tutorial");
  }

  openStats() {
    this.overlay.emit("stats");
  }

}
