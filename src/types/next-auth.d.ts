import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    roles: string[];
    permissions: string[];
    locale: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: string[];
      permissions: string[];
      locale: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    roles: string[];
    permissions: string[];
    locale: string;
  }
}
