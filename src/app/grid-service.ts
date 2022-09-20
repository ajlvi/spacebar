import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class GridService {
    boxSide = "52px";
    boxSizeSubject = new Subject<string>;

    constructor() {}

    //52x52 boxes would require width 347, height 465. we'll add a four pixel margin.
    determineBoxSize(width: number, height: number) {
        const gridVerticalRoom = height - 162 - 48; //clear head and keyboard
        if (width >= 355 && gridVerticalRoom >= 473) {
            this.boxSide = "52px";
        }
        else {
            const largestWidth = Math.floor( (width - 8 - 25)/6 );
            const largestHeight = Math.floor( (gridVerticalRoom - 8 - 35)/8 );
            this.boxSide = Math.min(largestWidth, largestHeight, 52).toString() + "px";
        }
        this.boxSizeSubject.next(this.boxSide);
    }

    getGridBoxSize() {return this.boxSide;}
}