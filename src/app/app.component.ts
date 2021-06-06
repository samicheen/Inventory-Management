import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'inventory-management';
  isLoading = true;

  constructor(public authService: AuthService) { }

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe((value) => {
      if(!value) {
        this.authService.loginWithRedirect();
      }
      this.isLoading = false;
    });
  }
}
