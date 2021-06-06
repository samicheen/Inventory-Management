import { Injectable } from '@angular/core';

@Injectable()
export class GapiSession {
    googleAuth: gapi.auth2.GoogleAuth;

    constructor() {}

    initClient() {
        return new Promise<void>((resolve,reject)=>{
            gapi.load('client:auth2', () => {
                return gapi.client.init({
                    clientId: '530178514460-kcmvg8a8ptos15olpjmtmdturvrrg0bm.apps.googleusercontent.com',
                    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4', 
                                    'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
                    scope: [
                        'https://www.googleapis.com/auth/spreadsheets', 
                        'https://www.googleapis.com/auth/gmail.readonly', 
                        'https://www.googleapis.com/auth/gmail.send'].join(' ')
                }).then(() => {                   
                    this.googleAuth = gapi.auth2.getAuthInstance();
                    resolve();
                });
            });
        });
        
    }
    get isSignedIn(): boolean {
        return this.googleAuth.isSignedIn.get();
    }

    get currentUser(): gapi.auth2.GoogleUser {
        return this.googleAuth.currentUser.get();
    }

    signIn() {
        return this.googleAuth.signIn();
    }

    signOut(): void {
        this.googleAuth.signOut();
    }
}