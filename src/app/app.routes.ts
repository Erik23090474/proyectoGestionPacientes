import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { PacientesComponent } from './components/pacientes/pacientes';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'pacientes', 
    component: PacientesComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/login' }
];