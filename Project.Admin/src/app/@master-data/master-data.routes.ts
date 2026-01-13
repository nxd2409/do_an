import { Routes } from "@angular/router";
import { Organize } from "./components/organize/organize";
import { Title } from "./components/title/title";
import { Room } from "./components/room/room";

export const masterDataRoutes: Routes = [
  { path: 'organize', component: Organize },
  { path: 'title', component: Title },
  { path: 'room', component: Room },
]
