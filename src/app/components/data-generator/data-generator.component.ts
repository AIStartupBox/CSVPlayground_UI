import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableShimmerComponent } from '../../common/table-shimmer/table-shimmer/table-shimmer.component';

interface EmployeeData {
  employeeId: string;
  fullName: string;
  department: string;
  annualSalary: number;
  hireDate: string;
}

@Component({
  selector: 'app-data-generator',
  imports: [CommonModule, FormsModule, TableShimmerComponent],
  templateUrl: './data-generator.component.html',
  styleUrl: './data-generator.component.css'
})
export class DataGeneratorComponent {
  // Business Context
  dataRequirements: string = '';

  // Generation Parameters
  noOfRows: number = 1;
  minRows: number = 1;
  maxRows: number = 100;
  noOfColumns: number = 1;
  minColumns: number = 1;
  maxColumns: number = 20;
  selectedModel: string = 'Groq';
  selectedQuality: string = 'Standard';

  // Data Preview
  generatedData: EmployeeData[] = [
    { employeeId: 'EMP-2024-001', fullName: 'Sarah Chen', department: 'Engineering', annualSalary: 128500, hireDate: '2023-03-15' },
    { employeeId: 'EMP-2024-002', fullName: 'Michael Rodriguez', department: 'Sales', annualSalary: 95000, hireDate: '2022-08-22' },
    { employeeId: 'EMP-2024-003', fullName: 'Emily Johnson', department: 'Marketing', annualSalary: 87500, hireDate: '2023-01-10' },
    { employeeId: 'EMP-2024-004', fullName: 'David Kim', department: 'Finance', annualSalary: 102000, hireDate: '2022-11-05' },
    { employeeId: 'EMP-2024-005', fullName: 'Lisa Thompson', department: 'Operations', annualSalary: 78500, hireDate: '2023-06-18' }
  ];

  totalRecords: number = 5;
  lastUpdated: string = 'Just now';
  showExportDropdown: boolean = false;
  isDataGenerated: boolean = false;
  isLoading: boolean = false;

  // Models
  models: string[] = ['Groq', 'Gemini'];

  // Quality Options
  qualityOptions: string[] = ['Standard', 'Normal', 'Premium'];

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

    // Simulate data generation with setTimeout
    setTimeout(() => {
      // Add your generation logic here
      this.isLoading = false;
      this.isDataGenerated = true;
    }, 2000); // 2 second delay to show shimmer
  }

  downloadExcel(): void {
    console.log('Downloading Excel file...');
    // Add download logic here
  }

  downloadCSV(): void {
    console.log('Downloading CSV file...');
    // Add download logic here
  }

  downloadJSON(): void {
    console.log('Downloading JSON file...');
    // Add download logic here
  }

  createEndpoint(): void {
    console.log('Creating REST API endpoint...');
    // Add endpoint creation logic here
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
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
      // You can add a toast notification here if needed
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}
