import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserMeta } from './entities/user-meta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserMeta])],
  exports: [TypeOrmModule],
})
export class UsersModule {}