import { Clipboard } from "@angular/cdk/clipboard";
import { Injectable } from "@angular/core";
import { SecretIndexService } from "./secret-index.service";

@Injectable()
export class ResultsSharingService {
    private dayNum: number;

    private emojiDict = {
        "green": String.fromCodePoint(0x1F7E9),
        "yellow": String.fromCodePoint(0x1F7E8),
        "white": String.fromCodePoint(0x2B1C),
        "space": String.fromCodePoint(0x2B1B),
        "red": String.fromCodePoint(0x1F7E5)
    }

    constructor(private clipboard: Clipboard, private secretService: SecretIndexService) {
        if (this.secretService.isReady()) {
            this.dayNum = this.secretService.getDayNum();
        }
        else {
            this.secretService.dateSubject.subscribe(
                (result: number) => { this.dayNum = result; }
            )
        }
    }

    copyResultsToClipboard(guesses, colors:string[][]) {
        let guessStr: string = '';
        //we expect colors to be a list of arrays that are six long.
        if (guesses >= 7) {guessStr = "X";}
        else {guessStr = (guesses+1).toString();}
        let outputString = "5pace6ar #" + (this.dayNum-19255) + " " + guessStr + "/7"
        for (let row=0; row < colors.length; row++) {
            outputString = outputString + "\n";
            for (let char=0; char<colors[row].length; char++) {
                outputString = outputString + this.emojiDict[colors[row][char]];
            }
        }
        this.clipboard.copy(outputString);
    }
}