export interface AuthFormData {
  type: "signin" | "signup";
  username: string;
  name: string;
  password: string;
}
