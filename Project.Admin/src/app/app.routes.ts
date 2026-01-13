import { Routes } from '@angular/router';
import AuthGuard from './services/config/auth.guard.config';
import UnauthGuard from './services/config/auth.unguard.config';
import { systemManagerRoutes } from './@system-manager/system-manager.routes';
import { masterDataRoutes } from './@master-data/master-data.routes';
import { NotFound } from './layouts/not-found/not-found';
import { UnAuthen } from './layouts/un-authen/un-authen';
import { MaintainServer } from './layouts/maintain-server/maintain-server';
import { ErrorServer } from './layouts/error-server/error-server';
import { Login } from './@authentication/components/login';
import { BlankLayout } from './layouts/blank-layout/blank-layout';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./layouts/home/home').then(m => m.Home), canActivate: [AuthGuard] },

      {
        path: 'system-manager',
        loadChildren: () => import('./@system-manager/system-manager.routes').then(m => m.systemManagerRoutes),
        canActivate: [AuthGuard],
      },
      {
        path: 'master-data',
        loadChildren: () => import('./@master-data/master-data.routes').then(m => m.masterDataRoutes),
        canActivate: [AuthGuard],
      },
    ],
  },
  {
    path: '',
    component: BlankLayout,
    children: [
      { path: 'login', component: Login, canActivate: [UnauthGuard] },
      { path: 'error-server', component: ErrorServer, canActivate: [UnauthGuard] },
      { path: 'maintain-server', component: MaintainServer, canActivate: [UnauthGuard] },
      { path: 'un-authen', component: UnAuthen, canActivate: [UnauthGuard] },
    ],
  },
  { path: '**', component: NotFound },
];
