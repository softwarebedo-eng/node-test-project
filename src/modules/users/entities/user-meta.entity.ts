import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('wp_usermeta')
export class UserMeta {
  @PrimaryGeneratedColumn({ name: 'umeta_id' })
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'meta_key' })
  key!: string;

  @Column({ name: 'meta_value', type: 'longtext', nullable: true })
  value?: string; // أصبحت إختيارية لأنها تقبل null في قاعدة البيانات

  @ManyToOne(() => User, (user) => user.meta)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}