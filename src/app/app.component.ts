import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ServerLoadingComponent } from './common/server-loading/server-loading.component';
import { AppService } from './app.service';

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
  imports: [RouterOutlet, TableModule, CommonModule, NavbarComponent, ServerLoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  isServerHealthy: boolean = false;

  constructor(private appService: AppService) {}

  ngOnInit() {
    this.checkServerHealth();
  }

  checkServerHealth() {
    this.appService.checkServerHealth().subscribe({
      next: (response) => {
        if (response.status === 'healthy') {
          this.isServerHealthy = true;
        } else {
          setTimeout(() => this.checkServerHealth(), 3000);
        }
      },
      error: (error) => {
        console.log('Server not ready yet, retrying...');
        setTimeout(() => this.checkServerHealth(), 3000);
      }
    });
  }
}
