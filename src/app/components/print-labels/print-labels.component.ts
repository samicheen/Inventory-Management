import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { NotificationService } from '../../services/notification/notification.service';
import * as QRCode from 'qrcode';

// QR Code data structure
export interface QRCodeData {
  barcode: string;
  itemName: string;
  quantity: number; // Net quantity (after packaging weight deduction if applicable)
  unit: string;
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
    // Use a longer delay to ensure modal content is fully rendered
    this.generateQRCodes();
  }

  generateQRCodes(): void {
    if (!this.barcode) return;

    // Generate QR code for each label
    // Use a longer timeout and retry mechanism to ensure canvas elements are ready
    const maxRetries = 10;
    let retryCount = 0;
    
    const tryGenerate = () => {
      // Look for canvas elements within the modal (more specific selector)
      const modalElement = document.querySelector('.modal.show') || document.body;
      const canvasElements = modalElement.querySelectorAll('.qrcode-canvas');
      
      if (canvasElements.length > 0) {
        // Canvas elements found, generate QR codes
        canvasElements.forEach((canvas: any, index: number) => {
          try {
            if (canvas instanceof HTMLCanvasElement) {
              this.generateQRCodeOnCanvas(canvas, index);
            }
          } catch (error) {
            console.error('Error generating QR code:', error);
          }
        });
      } else if (retryCount < maxRetries) {
        // Canvas elements not found yet, retry after a short delay
        retryCount++;
        setTimeout(tryGenerate, 100);
      } else {
        console.warn('QR code canvas elements not found after multiple retries. Label count:', this.labelCount);
      }
    };
    
    // Start trying after a short initial delay
    setTimeout(tryGenerate, 200);
  }

  generateQRCodeOnCanvas(canvas: HTMLCanvasElement, index: number): void {
    // Create QR code data with weight information (same structure as print)
    // quantity field contains net quantity (after packaging weight deduction if applicable)
    let qrData: QRCodeData = {
      barcode: this.barcode,
      itemName: this.itemName,
      quantity: this.netQuantity !== undefined && this.netQuantity !== null ? this.netQuantity : this.quantity,
      unit: this.unit
    };
    
    // If we have multiple packages, use the specific package data
    if (this.allPackages && this.allPackages[index]) {
      const pkg = this.allPackages[index];
      qrData.barcode = pkg.package_barcode || this.barcode;
      // Use net_quantity if available (after packaging weight), otherwise use quantity
      qrData.quantity = pkg.net_quantity !== undefined && pkg.net_quantity !== null 
        ? pkg.net_quantity 
        : (pkg.quantity || this.quantity);
    }
    
    // Create QR code data string (JSON format) - same structure as print output
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
      const total = this.allPackages.reduce((total, pkg) => {
        const qty = (pkg.net_quantity !== undefined && pkg.net_quantity !== null) 
          ? Number(pkg.net_quantity) 
          : ((pkg.quantity !== undefined && pkg.quantity !== null) ? Number(pkg.quantity) : 0);
        return total + (isNaN(qty) ? 0 : qty);
      }, 0);
      return isNaN(total) ? 0 : total;
    }
    // If single package or no packages, return the quantity * labelCount
    const singleQty = (this.netQuantity !== undefined && this.netQuantity !== null) 
      ? Number(this.netQuantity) 
      : ((this.quantity !== undefined && this.quantity !== null) ? Number(this.quantity) : 0);
    const labelCount = (this.labelCount !== undefined && this.labelCount !== null) ? Number(this.labelCount) : 1;
    const result = (isNaN(singleQty) ? 0 : singleQty) * (isNaN(labelCount) ? 1 : labelCount);
    return isNaN(result) ? 0 : result;
  }

  getPackageQuantity(index: number): number {
    if (this.allPackages && this.allPackages[index]) {
      const pkg = this.allPackages[index];
      const qty = (pkg.net_quantity !== undefined && pkg.net_quantity !== null) 
        ? Number(pkg.net_quantity) 
        : ((pkg.quantity !== undefined && pkg.quantity !== null) ? Number(pkg.quantity) : 0);
      return isNaN(qty) ? 0 : qty;
    }
    // Fallback to netQuantity or quantity
    const qty = (this.netQuantity !== undefined && this.netQuantity !== null) 
      ? Number(this.netQuantity) 
      : ((this.quantity !== undefined && this.quantity !== null) ? Number(this.quantity) : 0);
    return isNaN(qty) ? 0 : qty;
  }

  onLabelCountChange(): void {
    // Regenerate QR codes when label count changes
    setTimeout(() => {
      this.generateQRCodes();
    }, 100);
  }

  async printLabels(): Promise<void> {
    if (!this.barcode) {
      this.notificationService.showError('Barcode is required for printing');
      return;
    }

    // Generate QR codes first and convert to base64 images
    const qrCodeImages = await this.generateQRCodeImages();

    // Create a new window with only the labels
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback if popup blocked - use current window
      window.print();
      return;
    }

    // Get all label HTML with embedded QR code images
    const labelsHtml = this.getLabelsHtmlWithQRImages(qrCodeImages);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Labels</title>
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
          .qrcode-canvas,
          .qrcode-image {
            width: 200px;
            height: 200px;
            max-width: 3.8in;
            margin: 10px 0;
            display: block;
          }
          .qrcode-placeholder {
            width: 200px;
            height: 200px;
            max-width: 3.8in;
            margin: 10px 0;
            display: block;
            background: #f0f0f0;
            border: 1px solid #ccc;
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
          // QR codes are already embedded as images, just open print dialog
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }

  private async generateQRCodeImages(): Promise<string[]> {
    const qrCodeImages: string[] = [];
    const itemName = this.itemName || 'Item';
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
    
    for (let i = 0; i < packagesToPrint.length; i++) {
      const pkg = packagesToPrint[i];
      const packageBarcode = pkg.package_barcode || defaultBarcode;
      // Safely convert to number
      const rawQuantity = (pkg.net_quantity !== undefined && pkg.net_quantity !== null) 
        ? pkg.net_quantity 
        : ((pkg.quantity !== undefined && pkg.quantity !== null) ? pkg.quantity : defaultNetQuantity);
      const displayQuantity = Number(rawQuantity);
      const safeQuantity = isNaN(displayQuantity) ? 0 : displayQuantity;
      
      // Create QR code data (quantity is already the net quantity)
      const qrData: QRCodeData = {
        barcode: packageBarcode,
        itemName: itemName,
        quantity: safeQuantity, // This is already the net quantity
        unit: unit
      };
      
      const qrDataString = JSON.stringify(qrData);
      
      try {
        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(qrDataString, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        qrCodeImages.push(qrCodeDataUrl);
      } catch (error) {
        console.error('Error generating QR code image:', error);
        // Push empty string as fallback
        qrCodeImages.push('');
      }
    }
    
    return qrCodeImages;
  }

  private getLabelsHtmlWithQRImages(qrCodeImages: string[]): string {
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
      // Safely convert to number
      const rawQuantity = (pkg.net_quantity !== undefined && pkg.net_quantity !== null) 
        ? pkg.net_quantity 
        : ((pkg.quantity !== undefined && pkg.quantity !== null) ? pkg.quantity : defaultNetQuantity);
      const displayQuantity = Number(rawQuantity);
      const safeQuantity = isNaN(displayQuantity) ? 0 : displayQuantity;
      
      const qrCodeImage = qrCodeImages[i] || '';
      
      html += `
        <div class="barcode-label">
          <div class="label-content">
            <div class="item-info">${itemName}</div>
            <div class="quantity-info">${safeQuantity.toFixed(2)} ${unit}</div>
            ${qrCodeImage ? `<img src="${qrCodeImage}" alt="QR Code" class="qrcode-image" style="width: 200px; height: 200px; margin: 10px 0; display: block;" />` : '<div class="qrcode-placeholder" style="width: 200px; height: 200px; margin: 10px 0; display: block; background: #f0f0f0; border: 1px solid #ccc;"></div>'}
            <div class="barcode-text">${packageBarcode}</div>
          </div>
        </div>
      `;
    });
    return html;
  }

  private getLabelsHtml(): string {
    // This method is kept for backward compatibility but not used in print
    return this.getLabelsHtmlWithQRImages([]);
  }

  close(): void {
    this.modalRef.hide();
  }
}

