import { type DefaultSession } from "next-auth";
import { type JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      provider: string | null;
      isCreator: boolean;
    };
  }

  interface User {
    id: string;
    provider?: string | null;
    isCreator?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    uid?: string;
    provider?: string | null;
    isCreator?: boolean;
  }
}
