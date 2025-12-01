import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../models/auth.model';
import { BarcodeScannerService } from '../../services/barcode/barcode-scanner.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    public authService: AuthService,
    private barcodeScannerService: BarcodeScannerService
  ) { }
  
  scanBarcode(barcode: string): void {
    if (barcode && barcode.trim()) {
      this.barcodeScannerService.scanBarcode(barcode.trim());
    }
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
