import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
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
  isMobile = false; // Will be set in ngOnInit
  isCollapsed = true; // Start collapsed, Bootstrap will expand on desktop automatically

  constructor(
    public authService: AuthService,
    private barcodeScannerService: BarcodeScannerService
  ) { }
  
  ngOnInit(): void {
    // Check if running on native platform (mobile app)
    this.isMobile = Capacitor.isNativePlatform();
    
    // On desktop (≥992px), menu should be expanded
    // Bootstrap's navbar-expand-lg handles this via CSS, but we need to set initial state
    if (window.innerWidth >= 992) {
      this.isCollapsed = false;
    }
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  scanBarcode(barcode: string): void {
    if (barcode && barcode.trim()) {
      this.barcodeScannerService.scanBarcode(barcode.trim());
    }
  }

  async openBarcodeScanner(): Promise<void> {
    const barcode = await this.barcodeScannerService.scanBarcodeWithCamera();
    if (barcode) {
      this.scanBarcode(barcode);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
