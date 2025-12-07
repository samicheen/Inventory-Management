import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GapiSession } from 'src/app/sessions/gapi.session';
import { BehaviorSubject } from 'rxjs';
import { GoogleService } from 'src/app/services/google.service';

@Component({
  selector: 'app-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss']
})
export class EmailComponent implements OnInit {

  showSignIn = false;
  googleAuth: gapi.auth2.GoogleAuth;
  googleUser: gapi.auth2.GoogleUser;
  private readonly refreshItems = new BehaviorSubject(undefined);

  excelValues = []

  constructor(private gapiSession: GapiSession, private googleService: GoogleService) { }

  @ViewChild("send") sendView: ElementRef;

  ngOnInit(): void {
    // Email functionality disabled - GAPI removed
    console.log('Email component: Marketing email functionality is disabled');
    this.showSignIn = false;
  }

  /**
   *  Called when the signed in status changes, to update the UI
   *  appropriately. After a sign-in, the API is called.
   */
  updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      this.showSignIn = false;
    } else {
      this.showSignIn = true;
    }
  }

  isSignedIn(){
    try {
      return this.gapiSession && this.gapiSession.isSignedIn;
    } catch (error) {
      return false;
    }
  }

  /**
   *  Sign in the user upon button click.
   */
  async handleAuthClick() {
    if (!this.gapiSession || typeof gapi === 'undefined') {
      console.error('GAPI not available. Email functionality requires Google API.');
      return;
    }
    try {
      const res = await this.gapiSession.signIn();
      console.log(typeof res);
    } catch (error) {
      console.error('Failed to sign in to Google:', error);
    }
  }

  /**
   * 
   */
  async sendEmails() {
    console.warn('Email functionality is disabled. GAPI has been removed.');
    alert('Email functionality is currently disabled. This feature required Google API which has been removed.');
  }
}
