import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Sessions } from './sessions/sessions';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'test',
    component: Sessions
  }
];
