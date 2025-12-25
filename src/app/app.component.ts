import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { filter } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'inventory-management';
  showHeader = true;

  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  async ngOnInit() {
    // Configure StatusBar for mobile
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (error) {
        // StatusBar might not be available, ignore error
      }
    }

    // Check if user is authenticated on app load
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }

    // Hide header on login page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showHeader = event.url !== '/login';
    });

    // Check initial route
    this.showHeader = this.router.url !== '/login';
  }
}
