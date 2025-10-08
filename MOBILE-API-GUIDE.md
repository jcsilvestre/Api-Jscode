# 📱 Guia de Compatibilidade Mobile - API JCS Code

## 🎯 Visão Geral

A API JCS Code está **totalmente preparada** para aplicações mobile, suportando tanto **aplicações web** quanto **aplicações mobile nativas** (React Native, Flutter, Ionic, etc.).

## ✅ Configurações Mobile Implementadas

### 🌐 CORS Configurado para Mobile

A API possui configuração completa de CORS que suporta:

- **React Native**: Requisições HTTP nativas
- **Flutter**: Requisições HTTP/HTTPS
- **Ionic/Capacitor**: Aplicações híbridas
- **Expo**: Desenvolvimento React Native
- **Cordova/PhoneGap**: Aplicações híbridas

### 🔧 Origens Permitidas

```typescript
origin: [
  // Web
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  
  // Mobile Development
  'http://localhost:3000',
  'http://10.0.2.2:3000',      // Android Emulator
  'http://localhost:19006',     // Expo
  'capacitor://localhost',      // Capacitor
  'ionic://localhost',          // Ionic
  
  // Regex patterns para desenvolvimento
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/10\.0\.2\.2(:\d+)?$/,
  /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/, // Rede local
]
```

### 📋 Headers Suportados

```typescript
allowedHeaders: [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'User-Agent',
  'DNT',
  'Cache-Control',
  'X-Mx-ReqToken',
  'Keep-Alive',
  'If-Modified-Since',
]
```

## 🔐 Sistema de Autenticação Mobile

### 🎫 Token de Verificação Atualizado

- **Formato**: 9 caracteres alfanuméricos (ex: `A1B2C3D4E`)
- **Caracteres**: A-Z e 0-9
- **Validade**: 15 minutos
- **Segurança**: Geração aleatória criptograficamente segura

### 📱 Endpoints da API

Base URL: `http://localhost:3000/v1/auth`

#### 1. Registro de Usuário
```http
POST /v1/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "minhasenha123"
}
```

#### 2. Verificação de Token
```http
POST /v1/auth/verify
Content-Type: application/json

{
  "email": "joao@exemplo.com",
  "token": "A1B2C3D4E"
}
```

#### 3. Reenvio de Token
```http
POST /v1/auth/resend
Content-Type: application/json

{
  "email": "joao@exemplo.com"
}
```

#### 4. Login
```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "joao@exemplo.com",
  "password": "minhasenha123"
}
```

## 📱 Exemplos de Implementação Mobile

### React Native (JavaScript)

```javascript
const API_BASE = 'http://10.0.2.2:3000/v1/auth'; // Android Emulator
// const API_BASE = 'http://localhost:3000/v1/auth'; // iOS Simulator

// Registro
const register = async (name, email, password) => {
  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro no registro:', error);
    throw error;
  }
};

// Verificação
const verifyToken = async (email, token) => {
  try {
    const response = await fetch(`${API_BASE}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro na verificação:', error);
    throw error;
  }
};
```

### Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  static const String baseUrl = 'http://10.0.2.2:3000/v1/auth';
  
  static Future<Map<String, dynamic>> register(
    String name, 
    String email, 
    String password
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
      }),
    );
    
    return jsonDecode(response.body);
  }
  
  static Future<Map<String, dynamic>> verifyToken(
    String email, 
    String token
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/verify'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'token': token,
      }),
    );
    
    return jsonDecode(response.body);
  }
}
```

### Ionic/Angular

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/v1/auth';

  constructor(private http: HttpClient) {}

  register(name: string, email: string, password: string) {
    return this.http.post(`${this.apiUrl}/register`, {
      name,
      email,
      password
    });
  }

  verifyToken(email: string, token: string) {
    return this.http.post(`${this.apiUrl}/verify`, {
      email,
      token
    });
  }
}
```

## 🔧 Configurações de Desenvolvimento

### Android Emulator
- Use `http://10.0.2.2:3000` para acessar localhost do host

### iOS Simulator
- Use `http://localhost:3000` normalmente

### Dispositivo Físico
- Use o IP da sua máquina na rede local (ex: `http://192.168.1.100:3000`)

## 🚀 Recursos Avançados

### 📊 Sessões de Usuário
A API rastreia sessões com informações mobile:
- IP Address
- User Agent (identifica o dispositivo/app)
- Login/Logout timestamps

### 🔐 JWT Tokens
- Tokens JWT para autenticação persistente
- Suporte a refresh tokens
- Expiração configurável

### 📧 Sistema de Email
- Tokens de verificação por email
- Templates HTML responsivos
- Fallback para logs em desenvolvimento

## ✅ Checklist de Compatibilidade Mobile

- ✅ CORS configurado para mobile
- ✅ Headers HTTP suportados
- ✅ Tokens alfanuméricos (9 caracteres)
- ✅ Endpoints RESTful
- ✅ Validação de dados
- ✅ Tratamento de erros
- ✅ JWT Authentication
- ✅ Sessões de usuário
- ✅ Sistema de email
- ✅ Suporte a regex patterns
- ✅ Compatibilidade com emuladores
- ✅ Suporte a rede local

## 🎯 Conclusão

A API está **100% preparada** para aplicações mobile, oferecendo:

1. **Flexibilidade**: Suporte a múltiplas plataformas
2. **Segurança**: Tokens seguros e JWT
3. **Facilidade**: Endpoints simples e bem documentados
4. **Compatibilidade**: Funciona com qualquer framework mobile

**Pronto para desenvolvimento mobile!** 🚀📱