import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { WritingService } from "./writing.service";

export interface ColorDict {
    theme: string; // name of pallete
    green: string; // for correctly placed letters
    yellow: string; // for letters out of position
    gray: string; // for letters not in word
    white: string; // for background of cells and buttons
    kgray: string; // for keyboard gray
    kwhite: string; // for keyboard white
    red: string; // for incorrect six-letter words
    black: string; // text color; borders of cells
    blue: string; // stats bar
}

@Injectable()
export class ColorService {
    private choice = "light"

    colorSubject = new Subject<ColorDict>;

    constructor(private writingService: WritingService) {
        this.choice = writingService.getThemeData();
        this.setColor(this.choice);
    }

    setColor(selection: string) {
        if  (selection === "light") {
            this.choice = "light";
            this.writingService.setThemeData("light");
            document.body.classList.remove('dark-theme');
            this.colorSubject.next( this.lightColorPalette() )
        }
        else if (selection === "dark") {
            this.choice = "dark";
            this.writingService.setThemeData("dark");
            document.body.classList.add('dark-theme');
            this.colorSubject.next( this.darkColorPalette() )
        }
    }

    getCurrentColors(): ColorDict {
        if (this.choice === "light") {return this.lightColorPalette() ; }
        else if (this.choice === "dark") {return this.darkColorPalette() ; }
    }

    lightColorPalette(): ColorDict {
        return {
            "theme": "light",
            "green": "#66aa66",
            "yellow": "#ffdd77",
            "gray": "lightgray",
            "white": "white",
            "kgray": "lightgray",
            "kwhite": "white",
            "red": "#ee3333",
            "black": "black",
            "blue": "#336699"
        }
    }

    darkColorPalette(): ColorDict {
        return {
            "theme": "dark",
            "green": "#336633",
            "yellow": "#bb8800",
            "gray": "lightgray",
            "white": "#333333",
            "kwhite": "lightgray",
            "kgray": "#333333",
            "red": "#ee3333",
            "black": "white",
            "blue": "#99ccee"
        }
    }
}