import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EnvironmentService {
  private environment: any;

  constructor(private http: HttpClient) {}

  loadEnvironment(): Promise<void> {
    return this.http
      .get('env.json').toPromise()
      .then((env) => {
        this.environment = env;
      })
      .catch((err) => {
        console.error('Could not load environment file:', err);
      });
  }

  getEnv(key: string): any {
    return this.environment ? this.environment[key] : null;
  }

  getAll(): any {
    return this.environment;
  }
}
