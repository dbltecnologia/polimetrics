import NextAuth, { DefaultSession } from "next-auth";

// 1 — Extendendo o objeto "user" disponível no frontend
declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    experience?: string;
    cityId?: string;
    instagram?: string;
    facebook?: string;
  }

  interface Session {
    user: {
      id: string;
      role?: string;
      experience?: string;
      cityId?: string;
      instagram?: string;
      facebook?: string;
    } & DefaultSession["user"];
  }
}

// 2 — Extendendo o token JWT
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    experience?: string;
    cityId?: string;
    instagram?: string;
    facebook?: string;
  }
}
