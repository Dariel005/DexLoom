import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { validateCredentialsLogin } from "@/lib/credentials-auth";
import { isCreatorUserId } from "@/lib/creator-profile";
import { sendWelcomeEmail } from "@/lib/welcome-email";
import { getOrCreateUserProfile } from "@/lib/profile-service";
import { upsertGoogleUser } from "@/lib/user-store";

const credentialsProvider = Credentials({
  name: "Email & Password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" }
  },
  async authorize(credentials) {
    const result = await validateCredentialsLogin({
      email: String(credentials?.email ?? ""),
      password: String(credentials?.password ?? "")
    });

    if (result.status !== "success") {
      return null;
    }

    const user = result.user;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      provider: user.provider
    };
  }
});

const providers: NextAuthOptions["providers"] = [credentialsProvider];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers,
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      async function hydrateTokenFromProfile(userId: string) {
        try {
          const profile = await getOrCreateUserProfile(userId);
          if (profile.displayName.trim().length > 0) {
            token.name = profile.displayName;
          }
          if (profile.avatarUrl !== undefined) {
            token.picture = profile.avatarUrl;
          }
        } catch {
          // Keep auth resilient if profile storage is unavailable.
        }
      }

      if (account?.provider === "google" && token.email) {
        const persisted = await upsertGoogleUser({
          email: token.email,
          name: user?.name ?? token.name ?? null,
          image: user?.image ?? null
        });
        const persistedUser = persisted.user;

        if (persisted.status === "created") {
          try {
            await sendWelcomeEmail(persistedUser);
          } catch {
            // Welcome email delivery must never block sign-in.
          }
        }

        token.uid = persistedUser.id;
        token.provider = persistedUser.provider;
        token.name = persistedUser.name;
        token.picture = persistedUser.image ?? null;
        await hydrateTokenFromProfile(persistedUser.id);
      } else if (user) {
        token.uid = user.id;
        token.provider =
          typeof user.provider === "string" ? user.provider : account?.provider ?? "credentials";
        if (typeof user.name === "string" && user.name.trim().length > 0) {
          token.name = user.name;
        }
        if (typeof user.image === "string") {
          token.picture = user.image;
        } else if (user.image === null) {
          token.picture = null;
        }
        await hydrateTokenFromProfile(user.id);
      } else if (
        typeof token.uid === "string" &&
        token.uid.trim().length > 0 &&
        (token.picture === undefined || token.picture === null)
      ) {
        await hydrateTokenFromProfile(token.uid);
      }

      if (trigger === "update" && session?.user) {
        if (typeof session.user.name === "string" && session.user.name.trim().length > 0) {
          token.name = session.user.name;
        }
        if (typeof session.user.image === "string" || session.user.image === null) {
          token.picture = session.user.image;
        }
      }

      token.isCreator =
        typeof token.uid === "string" && token.uid.trim().length > 0
          ? await isCreatorUserId(token.uid)
          : false;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.uid === "string" ? token.uid : "";
        session.user.provider = typeof token.provider === "string" ? token.provider : null;
        session.user.name = typeof token.name === "string" ? token.name : session.user.name;
        session.user.image =
          typeof token.picture === "string" || token.picture === null
            ? token.picture
            : session.user.image;
        session.user.isCreator = token.isCreator === true;
      }

      return session;
    }
  }
};
