import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, MenubarModule, ButtonModule, SidebarModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  encapsulation: ViewEncapsulation.None
})
export class NavbarComponent {
  menuItems: MenuItem[] = [];
  sidebarVisible: boolean = false;
  currentRoute: string = '';

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
      this.updateActiveMenuItem();
    });
  }

  ngOnInit() {
    this.menuItems = [
      {
        label: 'Data Generator',
        icon: 'fas fa-database',
        route: '/data-generator',
        styleClass: '',
        command: () => this.navigateTo('/data-generator')
      },
      {
        label: 'Data Formatter',
        icon: 'fas fa-sliders-h',
        route: '/data-formatter',
        styleClass: '',
        command: () => this.navigateTo('/data-formatter')
      },
      {
        label: 'Documentation',
        icon: 'fas fa-book',
        route: '/documentation',
        styleClass: '',
        command: () => this.navigateTo('/documentation')
      }
    ];
    this.currentRoute = this.router.url;
    this.updateActiveMenuItem();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.sidebarVisible = false;
  }

  updateActiveMenuItem() {
    this.menuItems.forEach(item => {
      item.styleClass = item['route'] === this.currentRoute ? 'nav-active' : '';
    });
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }

  toggleMobileMenu() {
    this.sidebarVisible = !this.sidebarVisible;
  }
}
