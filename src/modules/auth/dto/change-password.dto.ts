import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'كلمة المرور الحالية مطلوبة' })
  oldPassword!: string;

  @IsString()
  @MinLength(6, { message: 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف' })
  newPassword!: string;
}