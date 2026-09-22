import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserMeta } from './user-meta.entity';

@Entity('wp_users')
export class User {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id!: number;

  @Column({ name: 'user_login' })
  user_login!: string;

  @Column({ name: 'user_email' })
  email!: string;

  @Column({ name: 'user_pass' })
  password!: string;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ name: 'user_registered', type: 'datetime', nullable: true })
  registeredAt?: Date;

  @OneToMany(() => UserMeta, (meta) => meta.user)
  meta!: UserMeta[];
}