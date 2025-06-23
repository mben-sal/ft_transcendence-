# ft_transcendance

![Django](https://img.shields.io/badge/Django-092E20?style=flat-square&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=flat-square&logo=socket.io&logoColor=white)

## 🏓 Description

ft_transcendance C'est une application web complète qui permet de jouer au célèbre jeu Pong en ligne avec des fonctionnalités modernes : multijoueur, tournois, chat en temps réel, et bien plus encore.

## 🎯 Objectifs du projet

- Créer une Single Page Application (SPA) moderne
- Implémenter un jeu Pong multijoueur en temps réel
- Développer un système d'authentification sécurisé
- Gérer des tournois et un système de classement
- Intégrer des fonctionnalités de chat en direct
- Assurer la cybersécurité et l'accessibilité



## ⚡ Fonctionnalités principales

### 🎮 Jeu Pong
- **Multijoueur temps réel** avec WebSockets
- **Mode IA** avec différents niveaux de difficulté
- **Personnalisation** : couleurs, effets, power-ups
- **Responsive** : jouable sur mobile et desktop

### 🏆 Système de tournois
- **Organisation automatique** des matchs
- **Bracket system** avec élimination
- **Stockage blockchain** pour la transparence
- **Historique complet** des parties

### 💬 Chat en temps réel
- **Messages instantanés** via WebSocket
- **Channels multiples** (général, tournois, privé)
- **Modération** et commandes admin
- **Émojis et notifications**

### 🔐 Authentification & Sécurité
- **JWT tokens** avec refresh
- **OAuth 2.0** (42, Google, GitHub)
- **2FA** avec TOTP (Google Authenticator)
- **WAF** protection contre les attaques
- **HashiCorp Vault** pour les secrets

### 📊 Statistiques & Profils
- **Profils utilisateurs** complets
- **Statistiques détaillées** (victoires, défaites, ELO)
- **Historique des matchs**
- **Classements globaux**
- **Achievements system**

### ♿ Accessibilité
- **Support malvoyants** avec lecteurs d'écran
- **Navigation clavier** complète
- **Contraste élevé** et thèmes
- **Support multilingue**



## 🎮 Guide d'utilisation

### Première connexion
1. **Inscription** : Créer un compte ou OAuth
2. **2FA Setup** : Scanner le QR code
3. **Profil** : Personnaliser avatar et infos
4. **Premier match** : Jouer contre l'IA

### Créer un tournoi
1. Aller dans **Tournaments**
2. **Create Tournament** 
3. Définir les paramètres (nombre de joueurs, format)
4. **Invite Players** ou attendre les inscriptions
5. **Start Tournament** une fois complet

### Chat et social
- **Global Chat** : Discussion générale
- **Tournament Chat** : Pendant les tournois
- **Private Messages** : Messages directs
- **Friend System** : Ajouter des amis

## 🔧 Développement

### Architecture technique

**Frontend (SPA)**
- Vanilla JavaScript ou framework moderne
- WebSocket client pour temps réel
- Canvas/WebGL pour le rendu du jeu
- Responsive design mobile-first

**Backend Services**
- **API REST** : Django/FastAPI pour CRUD
- **WebSocket Server** : Node.js/Python pour temps réel
- **Database** : PostgreSQL avec migrations
- **Cache** : Redis pour sessions et performance

**DevOps & Security**
- **Containerization** : Docker multi-stage builds
- **Reverse Proxy** : Nginx avec SSL/TLS
- **Monitoring** : Logs centralisés et métriques
- **Security** : WAF, OWASP compliance, secrets management


## 🔒 Sécurité

### Mesures implémentées
- **HTTPS obligatoire** avec certificats valides
- **CSRF protection** sur toutes les routes
- **SQL injection** : Requêtes préparées uniquement
- **XSS protection** : Sanitization des inputs
- **Rate limiting** : Protection contre le spam
- **WAF** : Filtrage des requêtes malveillantes
- **Secrets** : HashiCorp Vault pour les clés sensibles

### Compliance
- **OWASP Top 10** : Protection contre les vulnérabilités principales
- **GDPR** : Gestion des données personnelles
- **Authentication** : Standards OAuth 2.0 et JWT
- **Audit logs** : Traçabilité des actions

## 📱 Responsive & Accessibilité

### Support devices
- 📱 **Mobile** : Touch controls pour le jeu
- 💻 **Desktop** : Clavier et souris
- 🎮 **Gamepad** : Support manettes (bonus)

### Accessibilité (WCAG 2.1)
- **Screen readers** : Support complet
- **Keyboard navigation** : Tab order logique
- **Color contrast** : Ratios conformes
- **Text scaling** : Jusqu'à 200%
- **Audio cues** : Feedback sonore pour le jeu



## 📚 Documentation

- [**API Documentation**](docs/API.md) : Endpoints et authentification
- [**Setup Guide**](docs/SETUP.md) : Installation détaillée
- [**Game Engine**](docs/GAME.md) : Architecture du jeu
- [**Security Guide**](docs/SECURITY.md) : Mesures de sécurité
- [**Deployment**](docs/DEPLOYMENT.md) : Guide de déploiement



## 👤 Contributeurs

| Membre | Rôle | Modules | Contact |
|--------|------|---------|---------|
| **Salah** 🟢 | Backend Lead | Framework, DB, Auth, Stats | [@salah](https://github.com/Salah-HT) |
| **Abdo** 🔵 | Game Engine | Chat, AI, Custom, Blockchain | [@abdo](https://github.com/abkhairi) |
| **Manar** 🌸 | Frontend Security | OAuth, 2FA, Accessibility | [@manar](https://github.com/mben-sal) |
| **Zakaria** ⚫ | DevOps | Infrastructure, Security, Monitoring | [@zakaria](https://github.com/24K4-43) |

## 📄 Licence

Ce projet est réalisé dans le cadre de la formation à l'École 42.

---

*"The ultimate full-stack challenge - where backend meets frontend, security meets gameplay, and teamwork makes the dream work!"* 🏓✨
