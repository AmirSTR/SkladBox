# Деплой АнтиСтоп на Railway

1. Залить проект на GitHub.
2. В Railway создать New Project.
3. Добавить PostgreSQL service.
4. Добавить Web Service from GitHub repo.
5. В Variables у Web Service добавить:
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET=длинный_секрет`
   - `NODE_ENV=production`
6. После деплоя выполнить Prisma migration:

```bash
npm run migrate:deploy
```

Если Railway не выполняет миграции отдельно, можно заменить build command на:

```bash
npm run build && npm run migrate:deploy
```
