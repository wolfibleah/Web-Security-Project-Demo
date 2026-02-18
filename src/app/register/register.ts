import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environments/environments';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf, HttpClientModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  [x: string]: any;
  user: any = {};
  confirmPassword = '';
  selectedFile?: File;
  messageSuccess = '';
  messageError = '';
  imageError: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  onSubmit() {
    if (this.user.password !== this.confirmPassword) {
      this.messageError = 'Parolele nu coincid!';
      return;
    }

    if (!this.user.username || !this.user.email || !this.user.password) {
      this.messageError = 'Completează toate câmpurile obligatorii corect!';
      return;
    }

    if (!this.selectedFile) {
      this.messageError = 'Trebuie să selectezi o imagine de profil!';
      this.messageSuccess = '';
      return;
    }

    if (this.user.password !== this.confirmPassword) {
      this.messageError = 'Parolele nu coincid!';
      this.messageSuccess = '';
      return;
    }

    const formData = new FormData();
    Object.keys(this.user).forEach((key) => formData.append(key, this.user[key]));
    if (this.selectedFile) formData.append('profileImage', this.selectedFile);

    this.http.post(`${environment.apiUrl}/register`, formData).subscribe({
      next: () => {
        alert('Înregistrare reușită!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        if (err.status === 409 && err.error?.message) {
          this.messageError = err.error.message;
        } else {
          this.messageError = 'A apărut o eroare, încearcă din nou!';
        }
        this.messageSuccess = '';
      },
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.imageError = null;
    this.selectedFile = undefined;

    if (!file) {
      this.imageError = 'Trebuie să selectezi o imagine de profil!';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.imageError = 'Fișierul trebuie să fie o imagine!';
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      this.imageError = 'Imaginea nu poate depăși 2MB!';
      return;
    }

    this.selectedFile = file;
  }
}
