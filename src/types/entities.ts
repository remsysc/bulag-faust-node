interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

//generic User Response
interface UserPublic {
  id: string;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

interface Role {
  id: string;
  name: string;
}

//extended entity for auth
interface UserWithRoles extends User {
  roles: Role[];
}

interface AuthCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

type PostStatus = "draft" | "published" | "archived";

interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  status: PostStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
}

interface PostWithRelations extends Post {
  author: UserPublic;
  categories: Category[];
  tags: Tag[];
}

interface Category {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

interface Tag {
  id: string;
  name: string;
  created_at: Date;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
}
interface Pageable {
  page: number;
  size: number;
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

export type {
  User,
  UserPublic,
  UserWithRoles,
  Role,
  AuthCredentials,
  RegisterCredentials,
  JWTPayload,
  PostStatus,
  Post,
  PostWithRelations,
  Category,
  Tag,
  ApiResponse,
  PageResponse,
  Pageable,
};
