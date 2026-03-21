declare namespace React {
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    command?: string;
    commandfor?: string;
  }
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    fetchpriority?: "high" | "low" | "auto";
  }
}
