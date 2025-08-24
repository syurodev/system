# packages/elysia

Gói này cung cấp các cấu hình, middleware, và trình xử lý (handler) dùng chung cho các dịch vụ backend được xây dựng bằng Elysia.js.

## Có sẵn trong package

### Connections
- `pg`: PostgreSQL connection pool với Bun SQL
- `redis`: Redis connection

### Repository Pattern
- `BaseRepository<T>`: Abstract class với CRUD operations
- `IRepository<T>`: Repository interface

### Handlers
- `errorHandler`: Global error handler
- `generateRequestIdHandler`: Request ID generator

### Middlewares
- `cors`: CORS configuration

## BaseRepository Usage

```typescript
import { BaseRepository, BaseEntity, getDatabase } from "@repo/elysia";

interface User extends BaseEntity {
  name: string;
  email: string;
}

class UserRepository extends BaseRepository<User> {
  constructor() {
    super("users");
  }

  protected mapToEntity(row: any): User {
    return {
      id: row.id,
      name: row.name, 
      email: row.email,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

// Transaction usage example (using Bun SQL .begin())
import { SQL } from "bun";
const sql = new SQL({ /* your db config */ });

await sql.begin(async (tx) => {
  const user = await userRepo.create({ name: "John", email: "john@example.com" }, tx);
  await userRepo.update(user.id, { name: "John Doe" }, tx);
  // Auto-commits on success, auto-rollback on error
});
```

**Available methods** (all support optional transaction parameter): `findById`, `find`, `findOne`, `findMany`, `save`, `saveAll`, `create`, `update`, `delete`, `exists`, `count`