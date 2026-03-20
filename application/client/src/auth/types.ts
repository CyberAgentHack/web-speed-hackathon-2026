export interface AuthFormData {
  type: "signin" | "signup";
  username: string;
  name: string;
  password: string;
}

export type AuthStatus = "loading" | "signedIn" | "signedOut";
