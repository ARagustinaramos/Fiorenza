# Fiorenza App

Aplicación full-stack con Next.js (frontend) y Express (backend).

## 🚀 Tecnologías

### Frontend
- **Next.js 14** - Framework de React
- **React 18** - Biblioteca de UI
- **Redux Toolkit** - Manejo de estado
- **Tailwind CSS** - Estilos
- **Axios** - Cliente HTTP

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **CORS** - Manejo de CORS
- **Mongoose** - ODM para MongoDB (opcional)

## 📁 Estructura del Proyecto

```
Fiorenza-app/
├── backend/
│   ├── routes/
│   │   ├── users.js
│   │   └── products.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── providers.js
│   │   └── globals.css
│   ├── store/
│   │   ├── store.js
│   │   └── slices/
│   │       ├── usersSlice.js
│   │       └── productsSlice.js
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## 🛠️ Instalación

### Backend

1. Navega a la carpeta del backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El backend estará corriendo en `http://localhost:3001`

### Frontend

1. Navega a la carpeta del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env.local` basado en `.env.local.example`:
```bash
cp .env.local.example .env.local
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará corriendo en `http://localhost:3000`

## 📡 API Endpoints

### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener un usuario por ID
- `POST /api/users` - Crear un nuevo usuario
- `PUT /api/users/:id` - Actualizar un usuario
- `DELETE /api/users/:id` - Eliminar un usuario

### Productos
- `GET /api/products` - Obtener todos los productos
- `GET /api/products/:id` - Obtener un producto por ID
- `POST /api/products` - Crear un nuevo producto
- `PUT /api/products/:id` - Actualizar un producto
- `DELETE /api/products/:id` - Eliminar un producto

### Health Check
- `GET /api/health` - Verificar estado del servidor
- `GET /api/test` - Endpoint de prueba

## 🎨 Características

- ✅ Arquitectura full-stack completa
- ✅ Redux Toolkit para manejo de estado
- ✅ Tailwind CSS para estilos modernos
- ✅ API RESTful con Express
- ✅ Configuración lista para producción
- ✅ Manejo de errores
- ✅ CORS configurado

## 📝 Scripts Disponibles

### Backend
- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon

### Frontend
- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 🔧 Configuración

Asegúrate de que el backend esté corriendo antes de iniciar el frontend, ya que el frontend hace peticiones a la API del backend.

## 📄 Licencia

ISC








