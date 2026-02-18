import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environments';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, HttpClientModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  username = '';
  password = '';
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ssoError')) {
        alert('Serviciul SSO este momentan indisponibil. Încercați mai târziu.');
      }
    }
  }

  onSubmit() {
    this.errorMessage = '';
    const username = this.username.trim().toLowerCase();
    const password = this.password.trim();

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const body = new URLSearchParams();

    body.set('username', username);
    body.set('password', password);
    console.log('Login:', this.username, this.password);

    this.http
      .post(`${environment.apiUrl}/verificare`, body.toString(), {
        headers,
        withCredentials: true,
        responseType: 'json',
      })
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.router.navigate(['/contulmeu'], {
              state: { username: res.username },
            });
          } else {
            this.errorMessage = res.message;
          }
        },
        error: (err) => {
          this.errorMessage = 'Username sau parola greșită.';
        },
      });
  }

  loginSSO() {
    window.location.href = `${environment.apiUrl}/login-sso`;
  }
}
