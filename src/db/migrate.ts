import pool from "./index";

const createTable = async () => {
  const client = await pool.connect();
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS users(
          id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username  VARCHAR(255) NOT NULL UNIQUE,
          email     VARCHAR(255) NOT NULL UNIQUE,
          password  VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW())`,
    );
    console.log("users table ready");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles(
          id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name  VARCHAR(255) NOT NULL UNIQUE)`);
    console.log("roles table ready");
    await pool.query(
      `CREATE TABLE IF NOT EXISTS user_roles(
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
            PRIMARY KEY(user_id, role_id))`,
    );
    console.log("user_roles table ready");
    await pool.query(`CREATE TABLE IF NOT EXISTS posts(
              id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              author_id   UUID REFERENCES users(id) ON DELETE CASCADE,
              title       VARCHAR(255) NOT NULL,
              content     TEXT NOT NULL,
              status      VARCHAR(25) NOT NULL DEFAULT 'draft'
                          CHECK(status IN ('draft', 'published', 'archived' )),
              created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
              updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
              deleted_at  TIMESTAMP
      )`);
    console.log("post table ready");

    await pool.query(`CREATE TABLE IF NOT EXISTS categories(
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name        VARCHAR(255) NOT NULL UNIQUE,
          created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
    )
`);
    console.log("categories table ready");

    await pool.query(`CREATE TABLE IF NOT EXISTS post_categories(
         post_id UUID REFERENCES posts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
         category_id UUID REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
         PRIMARY KEY(post_id, category_id)
)`);

    console.log("post_categories table ready");

    await pool.query(`CREATE TABLE IF NOT EXISTS tags(
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name        VARCHAR(255) NOT NULL UNIQUE,
          created_at  TIMESTAMP NOT NULL DEFAULT NOW() 
)`);
    console.log("tags table ready");

    await pool.query(`CREATE TABLE IF NOT EXISTS post_tags(
          post_id UUID REFERENCES posts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
          tag_id  UUID REFERENCES tags(id) ON DELETE RESTRICT ON UPDATE CASCADE,
          PRIMARY KEY(post_id, tag_id)
)`);
    console.log("post_tags table ready");

    await pool.query(`INSERT INTO roles(name) VALUES ('ROLE_USER'), ('ROLE_ADMIN')
                ON CONFLICT (name) DO NOTHING

`);
    console.log("roles seeeded");

    await pool.query(`INSERT INTO users(username, email, password)
              VALUES('admin', 'admin@test.com', 'admin123') ON CONFLICT(email) DO NOTHING
      
`);

    console.log("admin user seeded");

    await pool.query(`INSERT INTO user_roles(user_id, role_id)
                SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'admin@test.com' 
                      AND r.name = 'ROLE_ADMIN'
                    ON CONFLICT(user_id, role_id) DO NOTHING

`);
    console.log("Admin role assigned");

    console.log("migration complete");
  } catch (err) {
    console.error("migration failed: ", (err as Error).message);
  } finally {
    client.release();
  }
};

createTable();
