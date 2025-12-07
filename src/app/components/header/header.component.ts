import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
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

  constructor(
    public authService: AuthService,
    private barcodeScannerService: BarcodeScannerService
  ) { }
  
  ngOnInit(): void {
    // Check if running on native platform (mobile app)
    this.isMobile = Capacitor.isNativePlatform();
    
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
    if (!this.isMobile) {
      return;
    }

    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
        scanInstructions: 'Point your camera at a barcode',
        scanButton: false // Auto-start scanning without button
      });
      
      // Extract barcode string from result
      // The result structure is: { ScanResult: string, format: number }
      if (result && result.ScanResult) {
        const barcode = result.ScanResult.toString().trim();
        if (barcode) {
          this.scanBarcode(barcode);
        }
      }
    } catch (error: any) {
      console.error('Error scanning barcode:', error);
      // Don't show error for user cancellation
      if (error.message && !error.message.includes('cancel') && !error.message.includes('Cancel')) {
        alert('Error scanning barcode: ' + (error.message || 'Unknown error'));
      }
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
