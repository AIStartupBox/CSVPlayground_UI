import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  inStock: boolean;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TableModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'csv-playground-app';

  products: Product[] = [
    {
      id: 'P001',
      name: 'Laptop',
      category: 'Electronics',
      price: 1299.99,
      quantity: 15,
      inStock: true
    },
    {
      id: 'P002',
      name: 'Wireless Mouse',
      category: 'Accessories',
      price: 29.99,
      quantity: 50,
      inStock: true
    },
    {
      id: 'P003',
      name: 'Mechanical Keyboard',
      category: 'Accessories',
      price: 149.99,
      quantity: 0,
      inStock: false
    },
    {
      id: 'P004',
      name: 'Monitor 27"',
      category: 'Electronics',
      price: 399.99,
      quantity: 8,
      inStock: true
    },
    {
      id: 'P005',
      name: 'USB-C Hub',
      category: 'Accessories',
      price: 49.99,
      quantity: 25,
      inStock: true
    },
    {
      id: 'P006',
      name: 'Webcam HD',
      category: 'Electronics',
      price: 79.99,
      quantity: 12,
      inStock: true
    },
    {
      id: 'P007',
      name: 'Desk Lamp',
      category: 'Office Supplies',
      price: 39.99,
      quantity: 0,
      inStock: false
    },
    {
      id: 'P008',
      name: 'Ergonomic Chair',
      category: 'Furniture',
      price: 299.99,
      quantity: 5,
      inStock: true
    }
  ];
}
