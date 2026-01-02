import { Routes } from '@angular/router';
import { DataGeneratorComponent } from './components/data-generator/data-generator.component';
import { DataFormatterComponent } from './components/data-formatter/data-formatter.component';
import { DocumentationComponent } from './components/documentation/documentation.component';

export const routes: Routes = [
  { path: '', redirectTo: '/data-generator', pathMatch: 'full' },
  { path: 'data-generator', component: DataGeneratorComponent },
  { path: 'data-formatter', component: DataFormatterComponent },
  { path: 'documentation', component: DocumentationComponent },
  { path: '**', redirectTo: '/data-generator' }
];
