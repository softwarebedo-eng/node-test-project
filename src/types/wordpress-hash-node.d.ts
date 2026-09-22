declare module 'wordpress-hash-node' {
  export function CheckPassword(password: string, hash: string): boolean;
  export function HashPassword(password: string): string;
}