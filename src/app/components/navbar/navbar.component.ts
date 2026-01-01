import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, MenubarModule, ButtonModule, SidebarModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  menuItems: MenuItem[] = [];
  sidebarVisible: boolean = false;

  ngOnInit() {
    this.menuItems = [
      {
        label: 'Data Generator',
        icon: 'fas fa-database',
        styleClass: 'nav-active',
        command: () => this.navigateTo('data-generator')
      },
      {
        label: 'API Management',
        icon: 'fas fa-code',
        command: () => this.navigateTo('api-management')
      },
      {
        label: 'Documentation',
        icon: 'fas fa-book',
        command: () => this.navigateTo('documentation')
      },
      {
        label: 'Analytics',
        icon: 'fas fa-chart-line',
        command: () => this.navigateTo('analytics')
      }
    ];
  }

  navigateTo(route: string) {
    console.log('Navigating to:', route);
    this.sidebarVisible = false;
  }

  toggleMobileMenu() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}
