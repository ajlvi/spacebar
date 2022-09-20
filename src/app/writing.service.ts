import { Injectable } from "@angular/core";
import { CookieService } from "ngx-cookie";
import { SecretIndexService } from "./secret-index.service";

@Injectable()
export class WritingService {
    private expiry: Date;
    private allowsCookies = false;
    private initDayNo: number;

    private distribution: number[] // ones, twos, threes, ..., eights
    private totals: number[] // total, won, streak, longest, reds, lastwin; pct

    constructor (
        private cookieService: CookieService,
        private secretService: SecretIndexService
    ) {
        if (this.getDayNo() >= 0) { this.allowCookies(); }
        if (this.secretService.isReady()) {
            this.initialize(this.secretService.getDayNum())
        }
        else {
            this.secretService.dateSubject.subscribe(
                (dayno: number) => {
                    this.initialize(dayno);
                }
            )
        }
    }
    
    initialize(netDayNo: number) {
        this.expiry = new Date( new Date().getTime() + 365*24*60*60*1000) //local time here OK
        this.initDayNo = netDayNo;
        this.setDayNo(this.initDayNo); //mark that we're playing this game now
        this.distribution = this.getDistribution();
        this.totals = this.getTotals();
    }

    areCookiesAllowed() { return this.allowsCookies }

    allowCookies() { 
        this.allowsCookies = true;
    }

    setTotals(wonToday: boolean) {
        if (this.allowsCookies) {
            if (!this.checkGameFinished()) {
                this.totals[0]++;
                if (wonToday) { 
                    this.totals[1]++ ;
                    //was our previous win yesterday?
                    let lastWin = this.totals[5];
                    if (this.initDayNo - lastWin === 1) { this.totals[2]++; }
                    else { this.totals[2] = 1; }
                    if (this.totals[2] > this.totals[3]) {this.totals[3] = this.totals[2]}
                    this.totals[5] = this.initDayNo;
                }
                else { this.totals[2] = 0; }
                //check the guesslist for reds. we will find the answer as one with no space.
                for (let idx = 0; idx < this.getGuessList().length; idx++) {
                    if (!this.getGuessList()[idx].includes(" ")) { this.totals[4] ++ }
                }
                if (wonToday) {this.totals[4]--; }
                this.cookieService.put("totals", this.totals.slice(0, 6).toString(), {sameSite: "strict", expires: this.expiry}); 
            }
        }
    }

    getTotals(): number[] {
        const cookieTotals = this.cookieService.get("totals")
        if ( cookieTotals === undefined ) { return new Array(7).fill(0) }
        else {
            let seenTotals = JSON.parse("[" + cookieTotals + "]");
            seenTotals.push(Math.floor( (100*seenTotals[1])/seenTotals[0] ))
            return seenTotals;
        }
    }

    setDistribution(guessesToday: number) {
        if (this.allowsCookies) {
            this.setTotals(guessesToday <= 7);
            if (!this.checkGameFinished()) {
                if (guessesToday <= 7) { this.distribution[guessesToday]++; }
                this.cookieService.put("distribution", this.distribution.toString(), {sameSite: "strict", expires: this.expiry}); 
                this.setGameFinished()
            }
        }
    }

    getDistribution(): number[] {
        const cookieDistribution = this.cookieService.get("distribution")
        if ( cookieDistribution === undefined ) { return new Array(8).fill(0) }
        else {
            let seenDistribution = JSON.parse("[" + cookieDistribution + "]");
            return seenDistribution;
        }
    }

    setThemeData(theme: string) {
        if (this.allowsCookies) { 
            this.cookieService.put("theme", theme, {sameSite: "strict", expires: this.expiry}); 
        }
    }

    getThemeData(): string {
        const cookieTheme = this.cookieService.get("theme")
        if (cookieTheme === undefined) { return "light" }
        else { return cookieTheme }
    }

    setGuessList(guesses: string[]) {
        if (this.allowsCookies) {
            this.cookieService.put("guesses", guesses.toString(), {sameSite: "strict", expires: this.expiry}); 
        }
    }

    getGuessList(): string[] {
        const cookieGuesses = this.cookieService.get("guesses")
        if (cookieGuesses === undefined) { return [] }
        else { return cookieGuesses.split(",") }
    }

    getLastGameDate(): number {
        const cookieLastGame = this.cookieService.get("lastgame");
        if (cookieLastGame === undefined) {return -1 }
        else { return parseInt(cookieLastGame) }
    }

    setDayNo(dayno: number) {
        if (this.allowsCookies) {
            this.cookieService.put("dayno", dayno.toString(), {sameSite: "strict", expires: this.expiry});
        }
    }

    getDayNo() {
        const cookieDayNo = this.cookieService.get("dayno")
        if (cookieDayNo === undefined) { return -1 }
        else { return parseInt(cookieDayNo) }
    }

    setGameFinished() {
        if (this.allowsCookies) {
            this.cookieService.put("lastgame", this.initDayNo.toString(), {sameSite: "strict", expires: this.expiry});
        }
    }

    clearGameFinished() {
        this.cookieService.remove("lastgame");
    }

    checkGameFinished(): boolean {
        const cookieFinished = this.cookieService.get("lastgame")
        if (cookieFinished === undefined) {return false}
        else {return cookieFinished === this.initDayNo.toString()}
    }
}