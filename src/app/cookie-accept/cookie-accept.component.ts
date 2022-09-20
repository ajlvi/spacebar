import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ColorDict, ColorService } from '../color-defintion.service';

@Component({
  selector: 'app-cookie-accept',
  templateUrl: './cookie-accept.component.html',
  styleUrls: ['./cookie-accept.component.css']
})
export class CookieAcceptComponent implements OnInit {
  @Output() decision = new EventEmitter<boolean>();
  palette: ColorDict;
  colorSub: Subscription;
  backgroundColor: string;
  borderColor: string;

  constructor(private colorService: ColorService) { 
    this.palette = colorService.getCurrentColors();
    this.updateColors();
    this.colorSub = this.colorService.colorSubject.subscribe(
      (data: ColorDict) => {
        this.palette = data;
        this.updateColors();
      }
    )
  }

  updateColors() {
    this.backgroundColor = this.palette["kgray"];
    this.borderColor = this.palette["black"];
  }

  acceptsCookies(decision: boolean) {this.decision.emit(decision)}

  ngOnInit(): void {
  }

}
