import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';

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
  imports: [RouterOutlet, TableModule, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

}
