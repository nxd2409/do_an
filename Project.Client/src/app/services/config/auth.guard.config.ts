import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const token = localStorage.getItem('accessToken');

        if (token) {
            return true;
        } else {
            const meetingId = route.params['meetingId'] || this.extractMeetingIdFromUrl(state.url);
            if (meetingId) {
                this.router.navigate(['/login', meetingId]);
            } else {
                this.router.navigate(['/login']);
            }
            return false;
        }
    }

    private extractMeetingIdFromUrl(url: string): string | null {
        const match = url.match(/\/meeting\/([^\/]+)/);
        return match ? match[1] : null;
    }
}

export default AuthGuard;
