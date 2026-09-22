import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم المستخدم مطلوب' })
  user_login: string;

  @IsEmail({}, { message: 'البريد الإلكتروني غير صالحة' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' })
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}