import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environments';

@Component({
  selector: 'app-contulmeu',
  imports: [CommonModule, HttpClientModule],
  providers: [Router],
  templateUrl: './contulmeu.html',
  styleUrl: './contulmeu.css',
})
export class Contulmeu implements OnInit {
  username: string = '';
  profileImageUrl: string = '';
  showImageModal: boolean = false;

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {
    const nav = this.router.getCurrentNavigation();
    this.username = nav?.extras?.state?.['username'] || 'utilizator';
  }

  ngOnInit() {
    this.loadProfileImage();
  }

  loadProfileImage() {
    const imageUrl = `${environment.apiUrl}/profile-image/${this.username}`;
    this.profileImageUrl = imageUrl;
  }

  openImageModal() {
    this.showImageModal = true;
  }

  closeImageModal() {
    this.showImageModal = false;
  }

  logout() {
    this.http.get(`${environment.apiUrl}/logout`, { withCredentials: true }).subscribe({
      next: (res: any) => {
        if (res.logout) {
          console.log('Logout successful, redirecting to login');
          window.location.href = `${window.location.protocol}//localhost:4200/login`;
        }
      },
      error: (err) => {
        console.error('Logout error:', err);
        window.location.href = `${window.location.protocol}//localhost:4200/login`;
      },
    });
  }

  goHome() {
    this.router.navigate(['/contulmeu']);
  }

  goToSearch() {
    this.router.navigate(['/find-user']);
  }
}
