import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { NotificationService } from '../../services/notification/notification.service';
import * as QRCode from 'qrcode';

// QR Code data structure
export interface QRCodeData {
  barcode: string;
  itemName: string;
  quantity: number;
  unit: string;
  netQuantity?: number; // For packages with packaging weight
}

@Component({
  selector: 'app-print-labels',
  templateUrl: './print-labels.component.html',
  styleUrls: ['./print-labels.component.scss']
})
export class PrintLabelsComponent implements OnInit, AfterViewInit {
  // Properties assigned from initialState by ngx-bootstrap (no @Input() needed)
  barcode: string;
  itemName: string;
  quantity: number;
  unit: string;
  labelCount: number = 1; // Number of labels to print (auto-set from package_quantity)
  netQuantity?: number; // Net quantity (after packaging weight deduction)
  allPackages?: any[]; // All packages for batch printing

  @ViewChild('qrcodeCanvas', { static: false }) qrcodeCanvas: ElementRef;

  constructor(
    public modalRef: BsModalRef,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // Debug: Log to verify values are being passed
    console.log('PrintLabelsComponent initialized with:', {
      barcode: this.barcode,
      itemName: this.itemName,
      quantity: this.quantity,
      unit: this.unit,
      labelCount: this.labelCount
    });
  }

  ngAfterViewInit(): void {
    // Generate QR codes after view is initialized
    this.generateQRCodes();
  }

  generateQRCodes(): void {
    if (!this.barcode) return;

    // Generate QR code for each label
    setTimeout(() => {
      const canvasElements = document.querySelectorAll('.qrcode-canvas');
      canvasElements.forEach((canvas: any, index: number) => {
        try {
          this.generateQRCodeOnCanvas(canvas, index);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      });
    }, 100);
  }

  generateQRCodeOnCanvas(canvas: HTMLCanvasElement, index: number): void {
    // Create QR code data with weight information
    const qrData: QRCodeData = {
      barcode: this.barcode,
      itemName: this.itemName,
      quantity: this.quantity,
      unit: this.unit
    };
    
    // If we have net quantity (from packages with packaging weight), include it
    if (this.netQuantity !== undefined && this.netQuantity !== null) {
      qrData.netQuantity = this.netQuantity;
    }
    
    // If we have multiple packages, use the specific package data
    if (this.allPackages && this.allPackages[index]) {
      const pkg = this.allPackages[index];
      qrData.barcode = pkg.package_barcode || this.barcode;
      qrData.quantity = pkg.net_quantity || pkg.quantity || this.quantity;
      qrData.netQuantity = pkg.net_quantity;
    }
    
    // Create QR code data string (JSON format)
    const qrDataString = JSON.stringify(qrData);
    
    // Use QRCode library (imported from npm package)
    QRCode.toCanvas(canvas, qrDataString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).catch((error: any) => {
      console.error('QR Code generation error:', error);
    });
  }

  getLabelArray(): number[] {
    return Array.from({ length: this.labelCount }, (_, i) => i + 1);
  }

  getTotalQuantity(): number {
    if (this.allPackages && this.allPackages.length > 0) {
      // Sum up all package quantities
      return this.allPackages.reduce((total, pkg) => {
        const qty = pkg.net_quantity || pkg.quantity || 0;
        return total + qty;
      }, 0);
    }
    // If single package or no packages, return the quantity * labelCount
    const singleQty = this.netQuantity !== undefined && this.netQuantity !== null 
      ? this.netQuantity 
      : this.quantity;
    return singleQty * this.labelCount;
  }

  onLabelCountChange(): void {
    // Regenerate QR codes when label count changes
    setTimeout(() => {
      this.generateQRCodes();
    }, 100);
  }

  printLabels(): void {
    if (!this.barcode) {
      this.notificationService.showError('Barcode is required for printing');
      return;
    }

    // Create a new window with only the labels
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback if popup blocked - use current window
      window.print();
      return;
    }

    // Get all label HTML
    const labelsHtml = this.getLabelsHtml();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Labels</title>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        <script>
          // QRCode library will be available as window.QRCode after script loads
        </script>
        <style>
          @page {
            size: 4in 6in;
            margin: 0;
          }
          @media print {
            @page {
              size: 4in 6in;
              margin: 0;
            }
            /* Hide browser headers and footers */
            @page {
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .barcode-label {
            width: 4in;
            height: 6in;
            border: 1px solid #000;
            padding: 0.15in;
            margin: 0;
            page-break-after: always;
            page-break-inside: avoid;
            display: block;
            box-sizing: border-box;
          }
          .label-content {
            text-align: center;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0.05in;
          }
          .item-info {
            font-size: 16px;
            margin-bottom: 10px;
            line-height: 1.3;
            font-weight: bold;
          }
          .quantity-info {
            font-size: 14px;
            color: #000;
            margin-bottom: 15px;
            line-height: 1.3;
          }
          .qrcode-canvas {
            width: 200px;
            height: 200px;
            max-width: 3.8in;
            margin: 10px 0;
            display: block;
          }
          .barcode-text {
            font-size: 16px;
            font-weight: bold;
            margin-top: 10px;
            font-family: 'Courier New', monospace;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
        <script>
          // Generate QR codes after page and library loads
          function generateAllQRCodes() {
            // Wait for QRCode library to be available
            if (typeof window.QRCode === 'undefined') {
              setTimeout(generateAllQRCodes, 100);
              return;
            }
            
            const allPackages = ${JSON.stringify(this.allPackages || [])};
            const defaultBarcode = '${this.barcode}';
            const defaultItemName = '${(this.itemName || '').replace(/'/g, "\\'")}';
            const defaultQuantity = ${this.quantity || 0};
            const defaultUnit = '${this.unit || 'KG'}';
            const defaultNetQuantity = ${this.netQuantity !== undefined && this.netQuantity !== null ? this.netQuantity : 'null'};
            
            const packagesToUse = allPackages && allPackages.length > 0 ? allPackages : [];
            const canvasElements = document.querySelectorAll('.qrcode-canvas');
            
            let qrCodesGenerated = 0;
            const totalQRCodes = canvasElements.length;
            
            canvasElements.forEach(function(canvas, index) {
              try {
                // Get package data if available
                let qrData = {
                  barcode: defaultBarcode,
                  itemName: defaultItemName,
                  quantity: defaultQuantity,
                  unit: defaultUnit
                };
                
                if (packagesToUse && packagesToUse[index]) {
                  const pkg = packagesToUse[index];
                  qrData.barcode = pkg.package_barcode || defaultBarcode;
                  const netQty = pkg.net_quantity !== undefined && pkg.net_quantity !== null 
                    ? pkg.net_quantity 
                    : (pkg.quantity || defaultQuantity);
                  qrData.quantity = netQty;
                  if (pkg.net_quantity !== undefined && pkg.net_quantity !== null) {
                    qrData.netQuantity = pkg.net_quantity;
                  }
                } else if (defaultNetQuantity !== null) {
                  qrData.quantity = defaultNetQuantity;
                  qrData.netQuantity = defaultNetQuantity;
                }
                
                const qrDataString = JSON.stringify(qrData);
                
                // Use window.QRCode from CDN in print window
                window.QRCode.toCanvas(canvas, qrDataString, {
                  width: 200,
                  margin: 2,
                  color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                  }
                }, function(error) {
                  if (error) {
                    console.error('Error generating QR code:', error);
                  }
                  qrCodesGenerated++;
                  // Print after all QR codes are generated
                  if (qrCodesGenerated === totalQRCodes) {
                    setTimeout(function() {
                      window.print();
                    }, 500);
                  }
                });
              } catch (error) {
                console.error('Error generating QR code:', error);
                qrCodesGenerated++;
                if (qrCodesGenerated === totalQRCodes) {
                  setTimeout(function() {
                    window.print();
                  }, 500);
                }
              }
            });
          }
          
          window.onload = function() {
            generateAllQRCodes();
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }

  private getLabelsHtml(): string {
    let html = '';
    const itemName = (this.itemName || 'Item').replace(/'/g, "\\'");
    const defaultQuantity = this.quantity || 0;
    const unit = this.unit || 'KG';
    const defaultBarcode = this.barcode || '';
    const defaultNetQuantity = this.netQuantity !== undefined && this.netQuantity !== null ? this.netQuantity : defaultQuantity;
    
    // If we have allPackages, use them; otherwise create labels from labelCount
    const packagesToPrint = this.allPackages && this.allPackages.length > 0 
      ? this.allPackages 
      : Array.from({ length: this.labelCount }, (_, i) => ({
          package_barcode: defaultBarcode,
          net_quantity: defaultNetQuantity,
          quantity: defaultQuantity
        }));
    
    packagesToPrint.forEach((pkg: any, i: number) => {
      const packageBarcode = pkg.package_barcode || defaultBarcode;
      const displayQuantity = pkg.net_quantity !== undefined && pkg.net_quantity !== null 
        ? pkg.net_quantity 
        : (pkg.quantity || defaultNetQuantity);
      
      html += `
        <div class="barcode-label">
          <div class="label-content">
            <div class="item-info">${itemName}</div>
            <div class="quantity-info">${displayQuantity.toFixed(2)} ${unit}</div>
            <canvas class="qrcode-canvas" id="qrcode-${i}"></canvas>
            <div class="barcode-text">${packageBarcode}</div>
          </div>
        </div>
      `;
    });
    return html;
  }

  close(): void {
    this.modalRef.hide();
  }
}

