import { 
  Injectable, 
  UnauthorizedException, 
  BadRequestException, 
  NotFoundException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserMeta } from '../users/entities/user-meta.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as WpHash from 'wordpress-hash-node';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserMeta) private userMetaRepository: Repository<UserMeta>,
    private jwtService: JwtService,
  ) {}

  // 🔑 تسجيل الدخول
 async login(dto: LoginDto) {
  const user = await this.userRepository.findOne({
    where: { email: dto.email },
    relations: { meta: true }, // 👈 استخدام Object بدلاً من Array
    select: {
      id: true,
      user_login: true,
      email: true,
      password: true,
      displayName: true,
    }, // 👈 استخدام Object بدلاً من Array
  });

  if (!user) {
    throw new UnauthorizedException('بيانات الدخول غير صحيحة');
  }
console.log('PASSWORD:', dto.password);
console.log('HASH:', user.password);
console.log(
  'HASH LENGTH:',
  user.password?.length,
);
console.log(
  'IS VALID:',
  WpHash.CheckPassword(dto.password, user.password),
);
  const isPasswordValid = await bcrypt.compare(
    dto.password,
     user.password,
  );

  if (!isPasswordValid) {
    throw new UnauthorizedException(' كلمة المرور غير صحيحة');
  }

  const phoneMeta = user.meta?.find((m) => m.key === 'phone_number')?.value || null;
  const firstName = user.meta?.find((m) => m.key === 'first_name')?.value || '';
  const lastName = user.meta?.find((m) => m.key === 'last_name')?.value || '';

  return {
    access_token: this.jwtService.sign({ sub: user.id, email: user.email }),
    user: {
      id: user.id,
      user_login: user.user_login,
      email: user.email,
      displayName: user.displayName,
      firstName,
      lastName,
      phone: phoneMeta,
    },
  };
}

  // 📝 تسجيل حساب جديد بنفس تنسيق Ultimate Member
  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: dto.email }, { user_login: dto.user_login }],
    });

    if (existingUser) {
      throw new BadRequestException('البريد الإلكتروني أو اسم المستخدم مُسجل بالفعل');
    }

    const hashedPassword = WpHash.HashPassword(dto.password);
    const fullName = `${dto.firstName || ''} ${dto.lastName || ''}`.trim();

    const newUser = this.userRepository.create({
      user_login: dto.user_login,
      email: dto.email,
      password: hashedPassword,
      displayName: fullName || dto.user_login,
      registeredAt: new Date(),
    });

    const savedUser = await this.userRepository.save(newUser);

    const metaData = [
      { userId: savedUser.id, key: 'first_name', value: dto.firstName || '' },
      { userId: savedUser.id, key: 'last_name', value: dto.lastName || '' },
      { userId: savedUser.id, key: 'phone_number', value: dto.phone || '' },
      { userId: savedUser.id, key: 'wp_capabilities', value: 'a:1:{s:8:"subscriber";b:1;}' },
      { userId: savedUser.id, key: 'community_status', value: 'approved' },
    ];

    await this.userMetaRepository.save(metaData);

    return this.login({ email: dto.email, password: dto.password });
  }

  // 👤 جلب بيانات المستخدم
 async getProfile(userId: number) {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: { meta: true }, // 👈 تعديل هنا
    select: {
      id: true,
      user_login: true,
      email: true,
      displayName: true,
      registeredAt: true,
    }, // 👈 تعديل هنا
  });

  if (!user) throw new UnauthorizedException('المستخدم غير موجود');

  const phone = user.meta?.find((m) => m.key === 'phone_number')?.value || null;
  const firstName = user.meta?.find((m) => m.key === 'first_name')?.value || '';
  const lastName = user.meta?.find((m) => m.key === 'last_name')?.value || '';

  return {
    id: user.id,
    user_login: user.user_login,
    email: user.email,
    displayName: user.displayName,
    firstName,
    lastName,
    phone,
    registeredAt: user.registeredAt,
  };
}

  // ✏️ تحديث البيانات الشخصية
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    if (dto.firstName || dto.lastName) {
      const currentMeta = await this.userMetaRepository.find({ where: { userId } });
      const fName = dto.firstName ?? currentMeta.find((m) => m.key === 'first_name')?.value ?? '';
      const lName = dto.lastName ?? currentMeta.find((m) => m.key === 'last_name')?.value ?? '';
      
      user.displayName = `${fName} ${lName}`.trim();
      await this.userRepository.save(user);
    }

    const metaUpdates = [
      { key: 'first_name', value: dto.firstName },
      { key: 'last_name', value: dto.lastName },
      { key: 'phone_number', value: dto.phone },
    ];

    for (const item of metaUpdates) {
      if (item.value !== undefined) {
        let metaRecord = await this.userMetaRepository.findOne({
          where: { userId, key: item.key },
        });

        if (metaRecord) {
          metaRecord.value = item.value;
          await this.userMetaRepository.save(metaRecord);
        } else {
          await this.userMetaRepository.save({
            userId,
            key: item.key,
            value: item.value,
          });
        }
      }
    }

    return this.getProfile(userId);
  }

  // 🔑 تغيير كلمة المرور
async changePassword(userId: number, dto: ChangePasswordDto) {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    }, // 👈 تعديل هنا
  });

  if (!user) throw new NotFoundException('المستخدم غير موجود');

  const isValid = WpHash.CheckPassword(dto.oldPassword, user.password);
  if (!isValid) {
    throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
  }

  user.password = WpHash.HashPassword(dto.newPassword);
  await this.userRepository.save(user);

  return { message: 'تم تغيير كلمة المرور بنجاح' };
}
}