import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as WpHash from 'wordpress-hash-node';
import { User } from '../users/entities/user.entity';
import { UserMeta } from '../users/entities/user-meta.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserMeta)
    private readonly userMetaRepository: Repository<UserMeta>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const whereConditions: Array<{ email?: string; user_login?: string }> = [];
// console.log(whereConditions)
    if (dto.email) {
      whereConditions.push({ email: dto.email });
    }
    if (dto.username) {
      whereConditions.push({ user_login: dto.username });
    }

    const existingUser = await this.userRepository.findOne({
      where: whereConditions,
    });

    if (existingUser) {
      throw new BadRequestException('البريد الإلكتروني أو اسم المستخدم مُسجل بالفعل');
    }

    const hashedPassword = WpHash.HashPassword(dto.password);
    const fullName = `${dto.firstName || ''} ${dto.lastName || ''}`.trim();

    const newUser = this.userRepository.create({
      user_login: dto.username,
      email: dto.email,
      password: hashedPassword,
      displayName: fullName || dto.username,
      registeredAt: new Date(),
    });

    const savedUser = await this.userRepository.save(newUser);
    const userId = savedUser.id;

    const rawMetadata = [
      { nickname: dto.username },
      { first_name: dto.firstName || '' },
      { last_name: dto.lastName || '' },
      { full_name: fullName },
      { country: dto.country || '' },
      { mobile: dto.mobile || '' },
      { job_title: dto.jobTitle || '' },
      { employer: dto.employer || '' },
      { why_you_need_apply: dto.whyYouNeedApply || '' },
      { account_status: 'awaiting_admin_review' },
      { wp_capabilities: 'a:1:{s:8:"um_guest";b:1;}' },
      { wp_user_level: '0' },
      { rich_editing: 'true' },
      { syntax_highlighting: 'true' },
      { comment_shortcuts: 'false' },
      { admin_color: 'modern' },
      { use_ssl: '0' },
      { show_admin_bar_front: 'true' },
      { um_user_profile_url_slug_user_login: dto.username },
    ];

    const metadataToInsert = rawMetadata.map((item) => {
      const [key, value] = Object.entries(item)[0];
      return this.userMetaRepository.create({
        userId,
        key,
        value,
      });
    });

    await this.userMetaRepository.insert(metadataToInsert);

    return { message: 'تم إنشاء الحساب بنجاح', userId };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: [
        { user_login: dto.login },
        { email: dto.login },
      ],
    });

    if (!user) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const isPasswordValid = WpHash.CheckPassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    const payload = { sub: user.id, email: user.email, username: user.user_login };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.user_login,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }
}