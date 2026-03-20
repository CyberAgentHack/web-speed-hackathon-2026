declare namespace React {
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    command?: string;
    commandfor?: string;
  }
}
