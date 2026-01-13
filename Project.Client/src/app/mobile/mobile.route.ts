import { Routes } from "@angular/router";
import { Home } from "./home/home";
import { Meeting } from "./meeting/meeting";

export const mobileRoutes: Routes = [
  { path: 'home', component: Home },
  { path: 'meeting/:meetingId', component: Meeting },
  
];
