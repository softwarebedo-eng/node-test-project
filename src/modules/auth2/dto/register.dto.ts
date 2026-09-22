// register.dto.ts
export class RegisterDto {
  username!: string;
  email!: string;
  password!: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  mobile?: string;
  jobTitle?: string;
  employer?: string;
  whyYouNeedApply?: string;
}