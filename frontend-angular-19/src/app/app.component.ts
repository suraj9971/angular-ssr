import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RuntimeConfigService, type RuntimeConfig } from './core/runtime-config.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'angular-routing';
  footerUrl = 'https://www.ganatan.com';
  footerLink = 'www.ganatan.com';
  // Config is already loaded globally by provideAppInitializer in app.config.ts
  // before the app renders, so it's just read here (available the same way in any component).
  runtimeConfig: RuntimeConfig;
  runtimeConfigSource: string;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object,
    private runtimeConfigService: RuntimeConfigService) {
    this.runtimeConfig = this.runtimeConfigService.getConfig();
    this.runtimeConfigSource = this.runtimeConfigService.getSource();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const navMain = this.document.getElementById('navbarCollapse');
      if (navMain) {
        navMain.onclick = function onClick() {
          if (navMain) {
            navMain.classList.remove("show");
          }
        }
      }
    }
  }

}
