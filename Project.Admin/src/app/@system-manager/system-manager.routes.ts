import { Routes } from '@angular/router';
import { Profile } from './components/profile/profile';
import { AccountGroup } from './components/account-group/account-group';
import { Account } from './components/account/account';
import { BackgroundJobs } from './components/background-jobs/background-jobs';
import { DocumentSystem } from './components/document-system/document-system';
import { HistoryLogin } from './components/history-login/history-login';
import { LogSystem } from './components/log-system/log-system';
import { Menu } from './components/menu/menu';
import { MessageSystem } from './components/message-system/message-system';
import { Right } from './components/right/right';
import { StatusIntegration } from './components/status-integration/status-integration';
import { StatusSystem } from './components/status-system/status-system';

export const systemManagerRoutes: Routes = [
  { path: 'profile', component: Profile },
  { path: 'document-system', component: DocumentSystem },
  { path: 'message-system', component: MessageSystem },
  { path: 'menu', component: Menu },
  { path: 'right', component: Right },
  { path: 'log-system', component: LogSystem },
  { path: 'status-system', component: StatusSystem },
  { path: 'background-jobs', component: BackgroundJobs },
  { path: 'history-login', component: HistoryLogin },
  { path: 'status-integration', component: StatusIntegration },
  { path: 'account', component: Account },
  { path: 'account-group', component: AccountGroup },
];
