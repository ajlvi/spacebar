import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ColorDict, ColorService } from '../color-defintion.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit {
  @Input() message: string;
  backgroundColor: string;
  borderColor: string;
  palette: ColorDict;
  colorSub: Subscription;

  constructor(private colorService: ColorService) { }

  ngOnInit(): void {
    this.palette = this.colorService.getCurrentColors();
    this.updateColors();
    this.colorSub = this.colorService.colorSubject.subscribe(
      (data: ColorDict) => {
        this.palette = data;
        this.updateColors()
      }
    )
  }

  updateColors() {
    this.backgroundColor = this.palette["kgray"]
    this.borderColor = this.palette["black"]
  }

}
