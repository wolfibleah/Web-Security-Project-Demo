<<<<<<< HEAD
# ProjectSW

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
=======
# Web Security Project - Demo

This project is a full-stack web security demonstration showcasing both offensive and defensive web application techniques. It features an **Angular frontend**, a **Node.js backend**, and a **Python Flask attacker server** to simulate and test web vulnerabilities in a controlled environment.

---

## Architecture Overview

- **Frontend (Angular)**
  - Responsive user interface for registration, login, and user management
  - Profile image upload
  - Client-side validation and sanitization using Angular forms
  - AJAX / fetch() requests to backend and attacker server

- **Backend (Node.js)**
  - Handles user registration, authentication, and search functionality
  - Server-side validation and sanitization
  - Logging of requests and security events
  - Protected routes and access control
  - OpenID Connect SSO integration with Keycloak

- **Attacker Server (Python Flask)**
  - Simulates real-world attack scenarios (XSS, cookie exfiltration, phishing)
  - Collects data from malicious payloads
  - Used for educational attack demonstrations

---

## Core Features

### 1. User Registration & Authentication
- Angular forms with validation:
  - Username, email, password, name, display name, personal website URL
  - Profile image upload
- Client-side sanitization
- Server-side validation and secure password handling
- Login system with protected routes
- OpenID Connect SSO with Keycloak

### 2. Vulnerability Demonstrations
- **SQL Injection**
  - User search endpoint
  - Detection and testing with SQLMap
- **Cross-Site Scripting (XSS)**
  - Reflected (non-persistent) XSS
  - Persistent (stored) XSS
  - AJAX-based data exfiltration
- **Phishing Simulation**
  - Cloned login page
  - Credential harvesting for educational purposes only

### 3. Security Features
- Logging and request monitoring
- Session management and access control
- HTTPS configuration with digital certificate
- Secure handling of sensitive data

---

## Technologies Used

- **Frontend:** Angular, HTML, CSS, Bootstrap
- **Backend:** Node.js
- **Attacker Server:** Python (Flask)
- **Database:** SQL (MySQL / SQLite)
- **Authentication:** OpenID Connect, Keycloak
- **Security Tools:** SQLMap, browser DevTools
- **HTTPS / TLS:** Digital certificate configuration

---

## Skills Demonstrated

- Full-stack development (Angular + Node.js + Python)
- Web application security principles
- Secure authentication and SSO integration
- Vulnerability testing (XSS, SQLi)
- Logging and monitoring
- HTTPS deployment
- Phishing and attack simulation (educational)

---

## Educational Purpose

This project is strictly for educational use. It provides hands-on experience with both attacking and securing web applications in a controlled environment.
>>>>>>> 75c9f8714014d94a736f597a0ea1669efe3dd3f7
