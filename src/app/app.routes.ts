import { Routes } from '@angular/router';
import { Register } from './register/register';
import { FindUser } from './find-user/find-user';
import { Login } from './login/login';
import { Contulmeu } from './contulmeu/contulmeu';

export const routes: Routes = [
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  { path: 'register', component: Register },
  { path: 'find-user', component: FindUser },
  { path: 'home', component: Contulmeu },
  { path: 'login', component: Login },
  { path: 'contulmeu', component: Contulmeu },
];
