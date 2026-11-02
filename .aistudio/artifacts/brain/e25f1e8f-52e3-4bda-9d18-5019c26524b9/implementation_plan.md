# FinanAPP — Plan de Arquitectura y Desarrollo Modular en Fases

Rediseño integral de FinanAPP aplicando **Clean Architecture basada en módulos** en el Backend, migración exclusiva a **MongoDB Atlas / remoto** (removiendo el almacenamiento local en JSON), modernización del Frontend con **TanStack Query, Zustand, React Hook Form y Axios**, y creación de un **Design System** centralizado y fácil de modificar, estructurado en fases con subtareas atómicas sujetas a confirmación.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Conexión a MongoDB Atlas (Nube)**:
> - Se eliminará la persistencia local por archivo JSON (`server/data/finanapp-db.json`) y la memoria local.
> - La aplicación se conectará directamente a tu cluster de MongoDB Atlas usando la variable de entorno `MONGODB_URI` en `.env`.
> - Se preparará `.env.example` y la configuración de Mongoose con reintentos y validación de conexión estricta.
> 
> **Credenciales de Administrador en Atlas**:
> Al iniciar la base de datos remota se generará o verificará el usuario administrador por defecto (`demo@finanapp.com` / `Demo123456`) con `role: 'ADMIN'`.

- **Decisión de Arquitectura Backend**: Clean Architecture Modular organizada por capas (`Domain`, `Application`, `Infrastructure`, `Presentation`) dentro de cada módulo (`auth`, `accounts`, `categories`, `transactions`, `budgets`, `savings`, `admin`).
- **Decisión de Stack Frontend**:
  - **Zustand**: Gestión de estado global ligero (sesión de usuario, preferencias de interfaz, modales activos).
  - **TanStack Query v5**: Gestión de estado del servidor (fetching, caching, mutaciones optimistas y revalidación automática de transacciones, cuentas y métricas).
  - **React Hook Form + Zod**: Formularios fuertemente tipados, sin re-renderizados innecesarios y con validaciones en tiempo real.
  - **Axios**: Cliente HTTP centralizado con interceptores para inyección de token JWT, control de caducidad y manejo homogéneo de errores.
- **Decisión de Flujo de Trabajo**: Ejecución secuencial con puntos de control (cada subtarea se valida y se confirma con el usuario antes de proceder a la siguiente).

---

### 1. Overview & Core Concept

- **Qué hace la aplicación**: FinanAPP es una plataforma de finanzas personales y control patrimonial en tiempo real. Permite gestionar múltiples cuentas financieras (bancarias, efectivo, ahorros, inversiones), registrar y clasificar transacciones con transferencias atómicas, fijar presupuestos por rubro con alertas preventivas, acumular metas de ahorro, generar análisis gráficos avanzados con exportación a PDF y Excel, y administrar usuarios mediante un panel de control con rol `ADMIN`.
- **Estructura del Backend (Clean Architecture Modular)**:
  - `domain`: Interfaces de entidades de negocio, tipos de valor y contratos de repositorios.
  - `application`: Casos de uso y servicios con la lógica de negocio pura.
  - `infrastructure`: Modelos de Mongoose, conexión con MongoDB Atlas y persistencia.
  - `presentation`: Controladores Express, esquemas de validación Zod y rutas HTTP.
- **Estructura del Frontend**:
  - `src/design-system`: Tokens visuales (colores, sombras, tipografía), componentes atómicos base (Button, Input, Card, Modal, Table, Badge, Dropdown, Alert) fáciles de modificar y temas.
  - `src/features`: Módulos de dominio (`auth`, `accounts`, `transactions`, `budgets`, `savings`, `reports`, `admin`) con sus propios hooks (TanStack Query), componentes y schemas.
  - `src/shared`: Cliente Axios configurado, utilidades de formato de moneda/fechas y componentes estructurales comunes (Navbar, Layout).

---

### 2. User Experience & Visual Design System

- **Design System Centralizado (`src/design-system`)**:
  - *Tokens (`tokens.ts`)*: Paleta semántica (`primary`, `neutral`, `success`, `danger`, `warning`), escalas tipográficas, radios de borde y espaciado unificados. Cualquier cambio en la identidad se realiza en un único archivo.
  - *Componentes Base Reutilizables*:
    - `DSButton`: Variantes (`primary`, `secondary`, `outline`, `ghost`, `danger`), estados de carga (`isLoading`) y accesibilidad WCAG.
    - `DSInput` & `DSSelect`: Integración directa con `React Hook Form` (`ref` forwarding, mensajes de error accesibles).
    - `DSCard`: Contenedores con elevación plana de 1px, padding proporcional y sin anidación de tarjetas dentro de tarjetas.
    - `DSModal`: Diálogos flotantes accesibles con trampas de foco y cierre con tecla Escape.
    - `DSTable`: Filas compactas con alineación numérica a la derecha y cifras tabulares (`font-mono tabular-nums`).
- **Navegación y Vistas**:
  - Barra superior limpia de 3 zonas (marca, enlaces de navegación con estado activo y perfil de usuario con badge de rol `ADMIN`).
  - Filtros y segmentación interactiva rápida para transacciones y rangos de fechas.

---

### 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Reemplazo total de la persistencia local por MongoDB Atlas**
  - *Enfoque*: Eliminar `finanapp-db.json` y el servidor en memoria. Configurar `connectMongoDB()` para conectarse exclusivamente a la URI remota de MongoDB Atlas provista en `MONGODB_URI`.
  - *Beneficio*: Datos persistentes en la nube oficial de MongoDB, soporte multi-dispositivo y escalabilidad sin depender de almacenamiento temporal en contenedor.
- **Decisión 2: Separación de Estado Servidor (TanStack Query) y Estado Cliente (Zustand)**
  - *Enfoque*: Zustand se encarga exclusivamente del estado efímero del cliente (token de autenticación, usuario en sesión, apertura de modales, tema visual). TanStack Query maneja todo el ciclo de vida de los datos remotos (cuentas, transacciones, presupuestos, usuarios en admin).
  - *Beneficio*: Eliminación de efectos secundarios manuales (`useEffect` descontrolados), revalidación automática tras crear/editar transacciones y cacheo inteligente.
- **Decisión 3: Arquitectura Limpia Modular en el Servidor**
  - *Enfoque*: Cada entidad cuenta con su propio módulo aislado con responsabilidades separadas. Los controladores solo parsean peticiones y delegan a servicios de aplicación, que a su vez utilizan repositorios para comunicarse con Mongoose.
  - *Beneficio*: Código altamente testeable, escalable, desacoplado y libre de dependencias cruzadas opacas.

---

### 4. Technical Architecture & Phased Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite + TS)                    │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 Design System (src/design-system)              │   │
│   │  Tokens · Button · Input · Select · Card · Modal · Table · Alert│   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│   ┌───────────────────────┬────────┴──────────────┬────────────────┐   │
│   │ Zustand Store         │ TanStack Query Hooks  │ React Hook Form│   │
│   │ (Auth, UI, Modals)    │ (Data Fetch & Cache)  │ (Validations)  │   │
│   └───────────┬───────────┴───────────┬───────────┴────────────────┘   │
│               │                       │                                │
│               └───────────────────────┼────────────────────────────────┘
│                                       ▼
│                               Axios HTTP Client                        │
│                           (JWT Interceptors & Error)                   │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │ (HTTP REST /api/v1)
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Clean Modular Express)                 │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Presentation: Routers, Auth & Role Middlewares, Controllers    │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    ▼                                   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Application: Business Services & Use Cases (Validations/Logic) │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    ▼                                   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Domain & Infrastructure: Entities, Repositories & Models       │   │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │
│                                    ▼
│                     MongoDB Atlas (Cloud Database)                     │
│                     Configurado mediante MONGODB_URI                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Desglose Detallado en Fases y Subtareas (Ejecución Paso a Paso)

#### FASE 1: Conexión a MongoDB Atlas y Limpieza de Almacenamiento Local
- [x] **Subtarea 1.1**: Eliminar el motor de base de datos local y snapshot JSON (`server/data/finanapp-db.json` y dependencias de `mongodb-memory-server`), depurando el script de migración temporal.
- [x] **Subtarea 1.2**: Configurar la conexión nativa a MongoDB Atlas mediante variable de entorno `MONGODB_URI` en `server/config/env.ts` y `.env.example`, con manejo robusto de errores de red y reconexión automática.
- [x] **Subtarea 1.3**: Crear el script de inicialización y seed inicial en MongoDB Atlas para sembrar las categorías por defecto del sistema y asegurar el usuario administrador inicial (`demo@finanapp.com` / `Demo123456`).
- *Punto de Control*: Verificación de conexión a Atlas y validación del login del usuario administrador. (COMPLETADO)

#### FASE 2: Reestructuración del Backend a Clean Architecture Modular
- [x] **Subtarea 2.1**: Definir la estructura de capas (`domain`, `application`, `infrastructure`, `presentation`) para el módulo de Autenticación y Usuarios (`server/modules/auth`), introduciendo el campo `role: 'ADMIN' | 'USER'`.
- [x] **Subtarea 2.2**: Refactorizar a Clean Architecture los módulos de Cuentas (`accounts`) y Categorías (`categories`).
- [x] **Subtarea 2.3**: Refactorizar a Clean Architecture el módulo de Transacciones (`transactions`) incorporando soporte para tipo `TRANSFER` entre cuentas con transacción atómica de saldo.
- [x] **Subtarea 2.4**: Refactorizar a Clean Architecture el módulo de Presupuestos (`budgets`) y crear el nuevo módulo de Metas de Ahorro (`savings`).
- [x] **Subtarea 2.5**: Crear el módulo de Administración (`server/modules/admin`) con endpoints protegidos por middleware `requireAdmin` (listar usuarios, bloquear/desbloquear, cambiar roles).
- *Punto de Control*: Verificación de rutas de la API, middleware de roles y transacciones atómicas de cuentas. (COMPLETADO)

#### FASE 3: Modernización del Frontend (TanStack Query, Zustand, React Hook Form, Axios)
- [x] **Subtarea 3.1**: Instalar y configurar las dependencias clave en frontend: `@tanstack/react-query`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`, `axios`.
- [x] **Subtarea 3.2**: Configurar el cliente central de `Axios` con interceptores de autenticación y manejo homogéneo de errores y reintentos.
- [x] **Subtarea 3.3**: Crear el store global con `Zustand` (`src/stores/authStore.ts` y `src/stores/uiStore.ts`) reemplazando los Contextos tradicionales por un estado reactivo y atómico.
- [x] **Subtarea 3.4**: Configurar el `QueryClient` de TanStack Query y construir hooks personalizados de datos (`useTransactionsQuery`, `useAccountsQuery`, `useBudgetsQuery`, `useSavingsQuery`, `useAdminUsersQuery`).
- *Punto de Control*: Verificación del flujo de sesión con Zustand y cacheo en TanStack Query sin errores de renderizado. (COMPLETADO)

#### FASE 4: Design System Centralizado y Desacoplado
- [x] **Subtarea 4.1**: Crear `src/design-system/tokens.ts` con la definición central de temas, colores semánticos, tipografías y espaciados fácilmente modificables.
- [x] **Subtarea 4.2**: Implementar componentes base desacoplados (`DSButton`, `DSInput`, `DSSelect`, `DSCard`, `DSModal`, `DSTable`, `DSBadge`, `DSAlert`).
- [x] **Subtarea 4.3**: Migrar los formularios de Login y Registro a `React Hook Form` con validaciones Zod y componentes del Design System.
- *Punto de Control*: Pruebas visuales del Design System y validación de formularios con mensajes accesibles. (COMPLETADO)

#### FASE 5: Nuevas Funcionalidades y Perfeccionamiento de Vistas
- [ ] **Subtarea 5.1**: Implementar la vista del Panel de Administración (`AdminUsersView`) accesible únicamente para usuarios con rol `ADMIN`.
- [ ] **Subtarea 5.2**: Implementar el módulo de Cuentas Financieras con soporte multidivisa y modal de transferencias entre cuentas propias.
- [ ] **Subtarea 5.3**: Implementar el módulo de Metas de Ahorro y alertas visuales proactivas para presupuestos al 80% y 100% de consumo.
- [ ] **Subtarea 5.4**: Implementar el módulo de Reportes Analíticos Financieros con visualización de métricas avanzadas y exportación estructurada a PDF y Excel/CSV.
- *Punto de Control*: Auditoría final de todas las vistas, pruebas de compilación y verificación integral del flujo contable.
