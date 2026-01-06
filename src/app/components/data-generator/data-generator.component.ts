import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableShimmerComponent } from '../../common/table-shimmer/table-shimmer/table-shimmer.component';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DataGeneratorService, GenerateCSVRequest, ResponseData } from '../../services/data-generator.service';
import { take } from 'rxjs/operators';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-data-generator',
  imports: [CommonModule, FormsModule, TableShimmerComponent, TableModule, ToastModule, TooltipModule],
  providers: [MessageService],
  templateUrl: './data-generator.component.html',
  styleUrl: './data-generator.component.css'
})
export class DataGeneratorComponent {
  private dataGeneratorService = inject(DataGeneratorService);
  private messageService = inject(MessageService);
  // Business Context
  dataRequirements: string = '';

  // Generation Parameters
  noOfRows: number = 1;
  minRows: number = 1;
  maxRows: number = 100;
  noOfColumns: number = 1;
  minColumns: number = 1;
  maxColumns: number = 20;
  selectedModel: string = 'groq';
  selectedQuality: string = 'basic';

  // Data Preview - Dynamic type based on API response
  generatedData: any[] = [];

  // Dynamic columns
  columns: string[] = [];

  // Store the raw API response data for insert endpoint
  rawResponseData: ResponseData | null = null;

  totalRecords: number = 5;
  lastUpdated: string = 'Just now';
  showExportDropdown: boolean = false;
  isDataGenerated: boolean = false;
  isLoading: boolean = false;
  isCreatingEndpoint: boolean = false;
  endpointId: string = '';

  // Models - key-value pairs
  models: { key: string; value: string }[] = [
    { key: 'groq', value: 'Groq: Llama 3.1 8B Instant' },
    { key: 'groq', value: 'Google GenAI: Gemini 2.5 Flash' }
  ];

  // Quality Options - key-value pairs
  qualityOptions: { key: string; value: string }[] = [
    { key: 'basic', value: 'Basic' },
    { key: 'standard', value: 'Standard' },
    { key: 'premium', value: 'Premium' }
  ];

  generateDataset(): void {
    console.log('Generating dataset with:', {
      requirements: this.dataRequirements,
      noOfRows: this.noOfRows,
      noOfColumns: this.noOfColumns,
      model: this.selectedModel,
      quality: this.selectedQuality
    });

    // Show loading state
    this.isLoading = true;
    this.isDataGenerated = false;

    // Prepare API payload
    const payload: GenerateCSVRequest = {
      context: this.dataRequirements,
      model_name: this.selectedModel,
      no_of_rows: this.noOfRows,
      no_of_columns: this.noOfColumns,
      quality: this.selectedQuality
    };

    // Call the API
    this.dataGeneratorService.generateCSV(payload)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);

          if (response.success && response.data) {
            // Store raw response data for insert endpoint
            this.rawResponseData = response.data;
            // Transform the API response data into table format
            this.transformResponseToTableData(response.data);
            this.isDataGenerated = true;

            // Show success toast
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Dataset generated successfully with ${this.noOfRows} rows!`,
              life: 4000
            });
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error generating dataset:', error);
          this.isLoading = false;
          this.isDataGenerated = false;

          // Show error toast
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to generate dataset. Please try again.',
            life: 5000
          });
        }
      });
  }

  transformResponseToTableData(data: any): void {
    // Set columns from API response
    this.columns = data.columns || [];

    // Transform rows array into objects for the table
    this.generatedData = data.rows.map((row: string[]) => {
      const rowObject: any = {};
      this.columns.forEach((column, index) => {
        rowObject[column] = row[index];
      });
      return rowObject;
    });

    console.log('Transformed data:', this.generatedData);
  }

  extractColumns(): void {
    if (this.generatedData && this.generatedData.length > 0) {
      this.columns = Object.keys(this.generatedData[0]);
    }
  }

  formatColumnHeader(column: string): string {
    // Convert camelCase to Title Case with spaces
    return column
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  downloadExcel(): void {
    if (!this.generatedData || this.generatedData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No data available to export.',
        life: 3000
      });
      return;
    }

    try {
      // Create worksheet from JSON data
      const worksheet = XLSX.utils.json_to_sheet(this.generatedData);

      // Create workbook and add the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `data-export-${timestamp}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);

      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded!',
        detail: 'Excel file downloaded successfully.',
        life: 3000
      });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download Excel file.',
        life: 3000
      });
    }
  }

  downloadCSV(): void {
    if (!this.generatedData || this.generatedData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No data available to export.',
        life: 3000
      });
      return;
    }

    try {
      // Create CSV header
      const headers = this.columns.join(',');

      // Create CSV rows
      const rows = this.generatedData.map(row => {
        return this.columns.map(col => {
          const value = row[col];
          // Escape values that contain commas, quotes, or newlines
          if (value && (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n'))) {
            return `"${value.toString().replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
      });

      // Combine header and rows
      const csvContent = [headers, ...rows].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `data-export-${timestamp}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded!',
        detail: 'CSV file downloaded successfully.',
        life: 3000
      });
    } catch (error) {
      console.error('Error downloading CSV:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download CSV file.',
        life: 3000
      });
    }
  }

  downloadJSON(): void {
    if (!this.generatedData || this.generatedData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No data available to export.',
        life: 3000
      });
      return;
    }

    try {
      // Convert data to formatted JSON
      const jsonContent = JSON.stringify(this.generatedData, null, 2);

      // Create blob and download
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `data-export-${timestamp}.json`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.messageService.add({
        severity: 'success',
        summary: 'Downloaded!',
        detail: 'JSON file downloaded successfully.',
        life: 3000
      });
    } catch (error) {
      console.error('Error downloading JSON:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to download JSON file.',
        life: 3000
      });
    }
  }

  copyAsCSV(): void {
    if (!this.generatedData || this.generatedData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No data available to copy.',
        life: 3000
      });
      return;
    }

    try {
      // Create CSV header
      const headers = this.columns.join(',');

      // Create CSV rows
      const rows = this.generatedData.map(row => {
        return this.columns.map(col => {
          const value = row[col];
          // Escape values that contain commas, quotes, or newlines
          if (value && (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n'))) {
            return `"${value.toString().replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
      });

      // Combine header and rows
      const csvContent = [headers, ...rows].join('\n');

      // Copy to clipboard
      navigator.clipboard.writeText(csvContent).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied!',
          detail: 'CSV data copied to clipboard successfully.',
          life: 3000
        });
      }).catch(err => {
        console.error('Failed to copy CSV:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to copy CSV to clipboard.',
          life: 3000
        });
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate CSV data.',
        life: 3000
      });
    }
  }

  copyAsJSON(): void {
    if (!this.generatedData || this.generatedData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No data available to copy.',
        life: 3000
      });
      return;
    }

    try {
      // Convert data to formatted JSON
      const jsonContent = JSON.stringify(this.generatedData, null, 2);

      // Copy to clipboard
      navigator.clipboard.writeText(jsonContent).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied!',
          detail: 'JSON data copied to clipboard successfully.',
          life: 3000
        });
      }).catch(err => {
        console.error('Failed to copy JSON:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to copy JSON to clipboard.',
          life: 3000
        });
      });
    } catch (error) {
      console.error('Error generating JSON:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate JSON data.',
        life: 3000
      });
    }
  }

  createEndpoint(): void {
    console.log('Creating REST API endpoint...');

    if (!this.rawResponseData) {
      console.error('No data available to create endpoint');
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please generate data first before creating an endpoint.',
        life: 4000
      });
      return;
    }

    this.isCreatingEndpoint = true;

    // Prepare payload for insert endpoint
    const payload = {
      data: this.rawResponseData
    };

    console.log('Insert Payload:', payload);

    // Call the insert API
    this.dataGeneratorService.insertData(payload)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          console.log('Insert API Response:', response);
          this.endpointId = response.id;
          this.isCreatingEndpoint = false;
          console.log('Endpoint created with ID:', this.endpointId);

          // Show success toast
          this.messageService.add({
            severity: 'success',
            summary: 'Endpoint Created',
            detail: `API endpoint created successfully! ID: ${this.endpointId}`,
            life: 5000
          });
        },
        error: (error) => {
          console.error('Error creating endpoint:', error);
          this.isCreatingEndpoint = false;

          // Show error toast
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create endpoint. Please try again.',
            life: 5000
          });
        }
      });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  toggleExportDropdown(): void {
    this.showExportDropdown = !this.showExportDropdown;
  }

  closeExportDropdown(): void {
    this.showExportDropdown = false;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(`https://csv-playground-backend.onrender.com${text}`).then(() => {
      console.log('Copied to clipboard:', text);
      // You can add a toast notification here if needed
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}
