## kysely-pglite example

Barebones example for using `kysely-pglite`. Just an API with 1 endpoint: `/user`

Start the server

```bash
pnpm dev
```

Using [httpie](https://httpie.io/docs/cli) to make some requests:

```bash
http http://0.0.0.0:3000/user
```

Get users

```json
{ "users": [] }
```

```bash
http POST http://0.0.0.0:3000/user name="Bruce Wayne"
```

Create a user

```json
{
  "user": {
    "createdAt": "2024-08-13T21:30:50.513Z",
    "id": 1,
    "name": "Bruce Wayne",
    "updatedAt": "2024-08-13T21:30:50.513Z"
  }
}
```

Update user

```bash
http PUT http://0.0.0.0:3000/user/1 name="Batman"
```

```json
{
  "user": {
    "createdAt": "2024-08-13T21:33:10.910Z",
    "id": 1,
    "name": "Batman",
    "updatedAt": "2024-08-13T21:34:55.851Z"
  }
}
```

Delete user

```bash
http DELETE http://0.0.0.0:3000/user/1
```

```bash
http http://0.0.0.0:3000/user
```

```json
{ "users": [] }
```
