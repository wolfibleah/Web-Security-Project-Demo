import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';

@Component({
  selector: 'app-find-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './find-user.html',
  styleUrls: ['./find-user.css'],
})
export class FindUser implements OnInit {
  responseText: string = '';
  searchResults: any[] = [];
  searchQuery: string = '';
  searchName: string = '';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setCookie('ppkcookie', 'testcookie', 7);
      this.checkCookie();
    }
  }

  button_ajax() {
    alert('Cookie has been set.');

    const url = 'http://localhost:5000/api/date';
    const xmlhttp = new XMLHttpRequest();

    xmlhttp.open('POST', url, true);
    xmlhttp.withCredentials = true;
    xmlhttp.setRequestHeader('Content-type', 'application/json; charset=UTF-8');

    xmlhttp.onload = () => {
      if (xmlhttp.status === 201 || xmlhttp.status === 200) {
        console.log('Post successfully created!');
        this.responseText = xmlhttp.responseText;
      } else {
        console.error('Eroare la cererea AJAX:', xmlhttp.status, xmlhttp.statusText);
        this.responseText = `Eroare: ${xmlhttp.status} ${xmlhttp.statusText}`;
      }
    };

    xmlhttp.onerror = () => {
      console.error('Eroare de rețea la cererea AJAX.');
      this.responseText = 'Eroare de rețea';
    };

    xmlhttp.send(JSON.stringify({ message: "Ajax it's working!" }));
  }

  searchUser() {
    const query = this.searchName.trim();

    if (!query) {
      this.responseText = ' Introduceti un text pentru a incepe cautarea.';
      return;
    }

    fetch(`${environment.apiUrl}/cauta?nume=${encodeURIComponent(this.searchName)}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Search results:', data);
        if (Array.isArray(data) && data.length === 0) {
          this.responseText = `Niciun utilizator cu acest nume.`;
        } else if (Array.isArray(data) && data.length > 0) {
          let resultsText = `Rezultatele căutării pentru "${this.searchName}" sunt:\n\n`;
          data.forEach((user, index) => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
            resultsText += `${index + 1}. ${fullName} (@${user.username})\n`;
          });
          this.responseText = resultsText;
        } else {
          this.responseText = JSON.stringify(data, null, 2);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        this.responseText = 'Eroare la căutare: ' + err.message;
      });
  }

  setCookie(cname: string, cvalue: string, hours: number) {
    if (!isPlatformBrowser(this.platformId)) return;

    const d = new Date();
    d.setTime(d.getTime() + hours * 60 * 60 * 1000);
    const expires = d.toUTCString();

    this.document.cookie = `${encodeURIComponent(cname)}=${encodeURIComponent(
      cvalue,
    )}; Path=/; Expires=${expires}`;
  }

  getCookie(cname: string) {
    const name = encodeURIComponent(cname) + '=';
    const ca = this.document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        return decodeURIComponent(c.substring(name.length, c.length));
      }
    }
    return '';
  }

  checkCookie() {
    const user = this.getCookie('username');
    if (user !== '') {
      alert('Welcome again ' + user);
    } else {
      console.log('No username cookie set. Current cookies:', this.document.cookie);
    }
    console.log('document.cookie:', this.document.cookie);
  }

  goHome() {
    this.router.navigate(['/contulmeu']);
  }

  goToSearch() {
    this.router.navigate(['/cauta']);
  }

  logout() {
    this.http.get(`${environment.apiUrl}/logout`, { withCredentials: true }).subscribe({
      next: (res: any) => {
        if (res.logout) {
          window.location.href = `${window.location.protocol}//localhost:4200/login`;
        }
      },
      error: (err) => {
        window.location.href = `${window.location.protocol}//localhost:4200/login`;
      },
    });
  }
}
