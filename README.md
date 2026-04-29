# Notas API

API REST para gestion de usuarios, autenticacion y notas. La implementacion actual usa MongoDB para usuarios/autenticacion y MySQL para notas.

## Principios REST aplicados

La API implementa estos principios vistos en clase:

- `Stateless`: cada solicitud envia su propio token JWT y no depende de sesion en servidor.
- `Recursos por URI`: usuarios, autenticacion y notas se exponen mediante rutas claras como `/api/v1/auth` y `/api/v1/notes`.
- `CRUD sobre HTTP`: se usan `GET`, `POST`, `PUT` y `DELETE` para consultar, crear, actualizar y eliminar recursos.
- `Representaciones JSON`: las respuestas se devuelven en JSON como formato principal de intercambio.
- `Codigos HTTP`: se usan codigos como `200`, `201`, `400`, `401`, `403`, `404` y `500` para comunicar el resultado.
- `Versionado por URI`: la API se organiza bajo `/api/v1`.
- `HATEOAS parcial`: las respuestas de notas incluyen enlaces `_links` para navegar entre recursos y acciones relacionadas.
- `Paginacion y filtrado`: la coleccion de notas soporta `page`, `limit`, `q`, `sortBy` y `order`.

## Base URL

- Desarrollo local: `http://localhost:3000`
- Prefijo de autenticacion: `/api/v1/auth`
- Prefijo de notas: `/api/v1/notes`
- Documentacion Swagger UI: `/api-docs`

## Autenticacion

La mayoria de los endpoints requieren un token JWT en el header:

```http
Authorization: Bearer <token>
```

## Health Check

### GET `/api/health`

Verifica que la API este activa.

Respuesta:

```json
{
  "status": "OK",
  "message": "API de notas activa"
}
```

## Auth API

### POST `/api/v1/auth/register`

Registra un nuevo usuario. En la implementacion actual solo valida JWT, no rol de administrador.

Headers:

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

Body:

```json
{
  "name": "Juan Perez",
  "email": "juan@example.com",
  "password": "123456",
  "role": "user"
}
```

Campos:

- `name` obligatorio

Query params opcionales:

- `page` numero de pagina, por defecto `1`
- `limit` elementos por pagina, por defecto `10`
- `q` busqueda por texto en `title` o `content`

Query params opcionales:

- `page` numero de pagina, por defecto `1`
- `limit` elementos por pagina, por defecto `10`
- `q` busqueda por texto en `title` o `content`
- `sortBy` campo de ordenamiento: `id`, `title`, `createdAt`, `updatedAt`
- `order` `asc` o `desc`
- `sortBy` campo de ordenamiento: `id`, `title`, `createdAt`, `updatedAt`
- `order` `asc` o `desc`
- `email` obligatorio y unico
- `password` obligatorio
- `role` opcional, valores permitidos: `user`, `admin`

Respuesta `201`:
"data": [
{
"id": 1,
"title": "Mi nota",
"content": "Contenido de la nota",
"imageUrl": null,
"isPrivate": false,
"password": null,
"userId": "1",
"_links": {
"self": "http://localhost:3000/api/v1/notes/1",
"update": "http://localhost:3000/api/v1/notes/1",
"delete": "http://localhost:3000/api/v1/notes/1",
"share": "http://localhost:3000/api/v1/notes/1/share",
"collection": "http://localhost:3000/api/v1/notes"
}
}
],
"meta": {
"page": 1,
"limit": 10,
"total": 1,
"totalPages": 1
},
"\_links": {
"self": "http://localhost:3000/api/v1/notes?page=1&limit=10",
"create": "http://localhost:3000/api/v1/notes"
}
Errores comunes:

- `401` si falta o es invalido el token
- `400` si faltan datos requeridos
- `500` si el email ya existe o falla el servidor

### POST `/api/v1/auth/login`

Inicia sesion y devuelve un JWT.

Headers:

- `Content-Type: application/json`

Body:

```json
{
  "email": "juan@example.com",
  "password": "123456"
}
```

Respuesta `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Errores comunes:

- `400` si faltan `email` o `password`
- `500` si las credenciales son invalidas

## Notes API

Las rutas de notas usan autenticacion JWT. El `req.user` contiene `id`, `email` y `role` dentro del token.

### POST `/api/v1/notes`

Crea una nota para el usuario autenticado.

Headers:

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data` o `application/json`

Si se envia imagen, el archivo debe venir en el campo `image`.

Campos:

- `title` obligatorio
- `content` obligatorio
- `imageUrl` se genera automaticamente si se sube archivo
- `isPrivate` opcional, por defecto `false`
- `password` opcional

Ejemplo de body JSON:

```json
{
  "title": "Mi nota",
  "content": "Contenido de la nota",
  "isPrivate": false
}
```

Respuesta `201`:

```json
{
  "id": 1,
  "title": "Mi nota",
  "content": "Contenido de la nota",
  "imageUrl": null,
  "isPrivate": false,
  "password": null,
  "userId": "1",
  "createdAt": "2026-04-28T00:00:00.000Z",
  "updatedAt": "2026-04-28T00:00:00.000Z"
}
```

### GET `/api/v1/notes`

Lista todas las notas del usuario autenticado.

Headers:

- `Authorization: Bearer <token>`

Respuesta `200`:

```json
[
  {
    "id": 1,
    "title": "Mi nota",
    "content": "Contenido de la nota",
    "imageUrl": null,
    "isPrivate": false,
    "password": null,
    "userId": "1"
  }
]
```

### GET `/api/v1/notes/:id`

Obtiene una nota por ID, solo si pertenece al usuario autenticado.

Headers:

- `Authorization: Bearer <token>`

Respuesta `200`:

```json
{
  "data": {
    "id": 1,
    "title": "Mi nota",
    "content": "Contenido de la nota",
    "imageUrl": "/uploads/12345.png",
    "isPrivate": false,
    "password": null,
    "userId": "1",
    "_links": {
      "self": "http://localhost:3000/api/v1/notes/1",
      "update": "http://localhost:3000/api/v1/notes/1",
      "delete": "http://localhost:3000/api/v1/notes/1",
      "share": "http://localhost:3000/api/v1/notes/1/share",
      "collection": "http://localhost:3000/api/v1/notes"
    }
  },
  "_links": {
    "self": "http://localhost:3000/api/v1/notes/1",
    "update": "http://localhost:3000/api/v1/notes/1",
    "delete": "http://localhost:3000/api/v1/notes/1",
    "share": "http://localhost:3000/api/v1/notes/1/share",
    "collection": "http://localhost:3000/api/v1/notes"
  }
}
```

### PUT `/api/v1/notes/:id`

Actualiza una nota propia.

Headers:

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data` o `application/json`

Si se envia imagen, el archivo debe venir en el campo `image`.

Respuesta `200` con la nota actualizada y sus enlaces.

### DELETE `/api/v1/notes/:id`

Elimina una nota. Solo puede hacerlo el propietario o un usuario con rol `admin`.

Headers:

- `Authorization: Bearer <token>`

Respuesta `200`:

```json
{
  "message": "Note deleted successfully"
}
```

### POST `/api/v1/notes/:id/share`

Comparte una nota por correo electronico.

Headers:

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

Body:

```json
{
  "email": "destino@example.com"
}
```

Respuesta `200`:

```json
{
  "message": "Email sent successfully"
}
```

## Static uploads

Los archivos subidos quedan disponibles en:

- `/uploads/<filename>`

## Respuestas de error comunes

- `400` datos faltantes o invalidos
- `401` token faltante o invalido
- `403` permisos insuficientes
- `404` nota no encontrada
- `500` error interno del servidor

## Variables de entorno relevantes

- `PORT`
- `APP_URL`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_SECURE`
- `MAIL_USER`
- `MAIL_PASS`
- `MAIL_FROM`
