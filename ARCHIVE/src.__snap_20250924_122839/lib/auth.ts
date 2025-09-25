import type { NextAuthOptions } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET, // belangrijk: expliciet zetten
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        url: "https://www.facebook.com/v20.0/dialog/oauth",
        params: {
          config_id: process.env.FACEBOOK_CONFIG_ID!, // Business Login configuration ID
          auth_type: "rerequest",
          prompt: "consent",
          scope: "public_profile,pages_show_list,pages_manage_posts",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // @ts-expect-error attach provider token
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // @ts-expect-error expose token naar client
      session.accessToken = token.accessToken ?? null;
      return session;
    },
  },
};