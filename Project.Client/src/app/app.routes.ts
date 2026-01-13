import { Routes } from '@angular/router';
import AuthGuard from './services/config/auth.guard.config';
import UnauthGuard from './services/config/auth.unguard.config';
import { NotFound } from './layouts/not-found/not-found';
import { UnAuthen } from './layouts/un-authen/un-authen';
import { MaintainServer } from './layouts/maintain-server/maintain-server';
import { ErrorServer } from './layouts/error-server/error-server';
import { Login } from './authentication/components/login';
import { BlankLayout } from './layouts/blank-layout/blank-layout';
import { MainLayout } from './layouts/main-layout/main-layout';
import { NotFoundMeeting } from './layouts/not-found-meeting/not-found-meeting';
import { webRoutes } from './web/web.route';
import { mobileRoutes } from './mobile/mobile.route';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      {
        path: '',
        canActivate: [AuthGuard],
        children: webRoutes,
      },
      {
        path: 'm',
        canActivate: [AuthGuard],
        children: mobileRoutes,
      }
    ]
  },

  {
    path: '',
    component: BlankLayout,
    children: [
      { path: 'login', component: Login, canActivate: [UnauthGuard] },
      { path: 'login/:meetingId', component: Login, canActivate: [UnauthGuard] },
      { path: 'error-server', component: ErrorServer },
      { path: 'maintain-server', component: MaintainServer },
      { path: 'un-authen', component: UnAuthen },
      { path: 'not-found-meeting', component: NotFoundMeeting },
    ]
  },

  { path: '**', component: NotFound },
];
