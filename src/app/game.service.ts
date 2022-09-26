import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";

import { GuessData } from "./guessdata.model";
import { ResponseData } from "./response.model";
import { SecretIndexService } from "./secret-index.service";
import { BackgroundData } from "./background-data.model";
import { ResultsSharingService } from "./results-sharing.service";
import { WritingService } from "./writing.service";

@Injectable()
export class GameService {
    private fives: string[];
    private sixes: string[];
    private secretWord: string;

    private gameFinished = false;
    private guessList: string[] = []; //guess history, for cookie
    private currentGuess: number = 0; //row number; matches index in array
    private activeWord: string[] = []; //for tracking current guess

    private backgroundColors: BackgroundData; //for keyboard background colors
    private colorHistory: string[][] = []; //for sharing to clipboard

    guessSubject = new Subject<[string[], boolean]>;
    activeSubject = new Subject<GuessData>;
    responseSubject = new Subject<ResponseData>;
    keyboardColorSubject = new Subject<BackgroundData>;
    messageSubject = new Subject<string>;
    firstRowSixGuardRail = false;

    secretWordNumber(): number {
        return 0
    }

    constructor(private http:HttpClient, 
                private secretMaker: SecretIndexService,
                private sharingService: ResultsSharingService,
                private writingService: WritingService) {
        this.backgroundColors = new BackgroundData(...new Array(26).fill("kwhite"))
        this.http.get('../assets/words.json').subscribe(
            (res) => {
                this.fives = res["fives"]
                this.sixes = res["sixes"]
                //we next get the secret word.
                //for that we need secretmaker's http time request to be done
                if (this.secretMaker.isReady()) {
                    this.initialize( this.secretMaker.generateSecretIndex(), res["target_six"] );
                }
                else {
                    this.secretMaker.indexSubject.subscribe(
                        (index: number) => {
                            this.initialize( index, res["target_six"] )
                        }
                    )
                }
            }
        )
    }

    initialize(secret_index: number, targets: string[]) {
        this.secretWord = targets[secret_index]
        //this code needs to be run after the secretmaker has a day number.
        //we shouldn't have run initialize before that's the case.
        let cookieDate = this.writingService.getDayNo();
        if ( cookieDate === this.secretMaker.getDayNum() ) {
            this.guessList = this.writingService.getGuessList()
            this.fillBoardFromGuessList();
        }
        else { this.writingService.clearGameFinished(); }
    }

    cookieNowAccepted() {
        this.writingService.allowCookies();
        this.writingService.writeDayNo();
        this.writingService.setGuessList(this.guessList);
        // if the game is over, we need to also write stats for the first time.
        if (this.gameFinished) {
            this.writingService.setDistribution(this.currentGuess)
        }
    }

    emitWord() {
        var letterArray: string[];
        if (this.activeWord.length < 6) {
            letterArray = this.activeWord.concat(Array(5-this.activeWord.length), '');
        }
        else {
            letterArray = this.activeWord;
        }
        this.activeSubject.next(
            new GuessData( this.currentGuess, letterArray )
        )
        // refresh legality in case the last keystroke pressed was backspace on an illegal
        this.responseSubject.next(
            new ResponseData( true, new Array(6).fill("white") )
        )
    }

    gameOver() { return this.gameFinished }

    wonGame(): boolean { return this.guessList[this.guessList.length-1] === this.secretWord; }

    getAnswer(): string { return this.secretWord; }

    getGuessNumber() { return this.currentGuess; }

    getAllGuesses() { return this.guessList; }

    goToNextWord() {
        this.currentGuess++;
        this.activeWord = [];
        /* this if block handles when the game is lost */
        if (this.currentGuess >= 7) { 
            this.gameFinished = true; 
            this.writingService.setDistribution(8);
        }
        this.writingService.setGuessList(this.guessList);
        this.guessSubject.next([this.guessList, this.gameFinished]);
        this.activeSubject.next( new GuessData( this.currentGuess, Array(6).fill("") ))
    }

    registerFiveGuess() {
        //first, store the current guess (eventually goes into cookie)
        if (this.activeWord.length == 5) {this.handleCharacter(" ")}
        const word = this.activeWord.reduce( (a, b) => a+b );
        this.guessList[this.currentGuess] = word;
        //we now get the colors.
        var colors = Array(6).fill("white");
        var secretLetters = this.secretWord.toUpperCase().split('');
        var seenLetters = [];
        // start with greens
        for (let idx=0; idx < this.activeWord.length; idx++) {
            if (this.activeWord[idx] === secretLetters[idx]) {
                colors[idx] = "green";
                seenLetters.push(this.activeWord[idx]);
                this.backgroundColors[this.activeWord[idx].toLowerCase()] = "green";
            }
            else if (!secretLetters.includes(this.activeWord[idx])) {
                this.backgroundColors[this.activeWord[idx].toLowerCase()] = "kgray";
            }
        }
        /* for yellows, we check how many overlaps there are, after discounting already
           discovered greens and yellows; the first N copies of char get turned yellow.
           note that if we see char again later, matchedCount has grown and so N=0. */
        for (let idx=0; idx < this.activeWord.length; idx++) {
            let char = this.activeWord[idx]
            let activeCount = this.activeWord.filter( x => x === char ).length;
            let secretCount = secretLetters.filter( x => x === char ).length;
            let matchedCount = seenLetters.filter( x => x === char).length;
            let yellows = Math.min(activeCount - matchedCount, secretCount - matchedCount);
            let wordIdx = 0;
            while (yellows > 0) {
                if (this.activeWord[wordIdx] === char && colors[wordIdx] === "white") {
                    colors[wordIdx] = "yellow";
                    yellows--;
                    seenLetters.push(char);
                    if (this.backgroundColors[char.toLowerCase()] !== "green") {
                        this.backgroundColors[char.toLowerCase()] = "yellow";
                    }
                }
                wordIdx++;
            }
        }
        this.responseSubject.next( new ResponseData( true, colors ) );
        this.keyboardColorSubject.next( this.backgroundColors );

        //now that we've emitted the colors, let's get spaces noted properly for the clipboard.
        let savedColors = [...colors]
        if (this.activeWord.includes(" ")) {
            const spaceIndex = this.activeWord.indexOf(" ")
            savedColors[spaceIndex] = "space";
        }
        this.colorHistory.push(savedColors);
        this.goToNextWord();
    }

    registerSixGuess() {
        const word = this.activeWord.reduce( (a, b) => a+b).toLowerCase();
        this.guessList[this.currentGuess] = word;
        /* this code executes when the game is won */
        if (word === this.secretWord) {
            this.gameFinished = true;
            for (let i=0; i<this.activeWord.length; i++) {
                this.backgroundColors[this.activeWord[i].toLowerCase()] = "green"
            }
            this.keyboardColorSubject.next( this.backgroundColors );
            this.responseSubject.next( new ResponseData( true, Array(6).fill("green") ) );
            this.colorHistory.push( new Array(6).fill("green") )
            this.guessSubject.next([this.guessList, this.gameFinished]);
            this.writingService.setGuessList(this.guessList);
            this.writingService.setDistribution(this.currentGuess);
        }
        else {
            this.responseSubject.next( new ResponseData( true, Array(6).fill("red")) );
            this.colorHistory.push( new Array(6).fill("red") )
            this.goToNextWord();
        }
    }

    isGuessLegalFive(): boolean {
        var guessedWord = '';
        for(let i=0; i<this.activeWord.length; i++) {
            if(this.activeWord[i] != " ") {
                guessedWord = guessedWord + this.activeWord[i].toLowerCase()
            }
        }
        return this.fives.includes(guessedWord);
    }

    isGuessLegalSix(): boolean {
        var guessedWord = this.activeWord.reduce( (a, b) => a+b ).toLowerCase();
        return this.sixes.includes(guessedWord);
    }

    handleCharacter(ch: string) {
        if (this.gameFinished) {return;}
        //ALPHANUMERIC: Accept if there is room in the current word
        if (ch.length === 1 && ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z"))) {
            if(this.activeWord.length <= 5) { 
                this.activeWord.push(ch.toUpperCase());
                this.emitWord()
            }
        }
        //SPACE: Accept if there is room AND we haven't accepted a space yet
        else if (ch === " " || ch === "-") {
            //does our word have a space in it? if so, ignore the keystroke
            if (this.activeWord.filter( x => x == " ").length === 0
             && this.activeWord.length <= 5) {
                this.activeWord.push(" ");
                this.emitWord()
            }
        }
        //BACKSPACE: Accept if a character is in the word already
        else if (ch === "Backspace") {
            if(this.activeWord.length >= 1) {
                this.activeWord.pop();
                this.emitWord()
            }
        }
        //ENTER: Game logic gets triggered here.
        else if (ch === "Enter") {
            // First, is the board filled appropriately? If so, see if it's a legal five.
            if((this.activeWord.length == 6 &&
                this.activeWord.filter( x => x == " ").length === 1)
            || (this.activeWord.length === 5 &&
                this.activeWord.filter( x => x == " ").length === 0)) {
                    if (this.isGuessLegalFive()) {
                        this.registerFiveGuess();
                    }
                    else {
                        this.responseSubject.next(
                            new ResponseData( false, Array(6).fill('white') )
                            )
                    }
            }
            // Is it a legal six? If so we can progress as well.
            else if (this.activeWord.length == 6 &&
                this.activeWord.filter( x => x == " ").length == 0) {
                    if (this.currentGuess === 0 && !this.firstRowSixGuardRail) {
                        this.messageSubject.next(`A six-letter word first? Press Enter again to confirm.`)
                        this.firstRowSixGuardRail = true;
                    }
                    else if (this.isGuessLegalSix()) {
                        this.registerSixGuess();
                    }
                    else {
                        this.responseSubject.next(
                            new ResponseData( false, Array(6).fill('white') )
                            )
                    }
            }
        }
    }

    copyResultsToClipboard() {
        this.sharingService.copyResultsToClipboard(this.currentGuess, this.colorHistory);
    }

    fillBoardFromGuessList() {
        this.firstRowSixGuardRail = true;
        for(let word=0; word < this.guessList.length; word++) {
            for(let ch=0; ch< this.guessList[word].length; ch++) {
                this.handleCharacter(this.guessList[word][ch])
            }
            this.handleCharacter("Enter")
        }
    }
}