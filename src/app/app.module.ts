import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { GameRowComponent } from './game-row/game-row.component';
import { KeyboardComponent } from './keyboard/keyboard.component';
import { HeaderComponent } from './header/header.component';
import { TutorialComponent } from './tutorial/tutorial.component';
import { CookieModule } from 'ngx-cookie';
import { StatsComponent } from './stats/stats.component';
import { CookieAcceptComponent } from './cookie-accept/cookie-accept.component';
import { MessageComponent } from './message/message.component';

@NgModule({
  declarations: [
    AppComponent,
    GameRowComponent,
    KeyboardComponent,
    HeaderComponent,
    TutorialComponent,
    StatsComponent,
    CookieAcceptComponent,
    MessageComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    CookieModule.withOptions()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
