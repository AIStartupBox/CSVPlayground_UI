import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private healthCheckUrl = 'https://csv-playground-backend.onrender.com/health';

  constructor(private http: HttpClient) {}

  checkServerHealth(): Observable<any> {
    return this.http.get(this.healthCheckUrl);
  }
}
