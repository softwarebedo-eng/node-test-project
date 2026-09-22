import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bedo_products') // استبدل باسم جدولك في الداتا بيز
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'cat_id', type: 'int' })
  catId!: number;

  @Column({ name: 'last_version', type: 'varchar', length: 50, nullable: true })
  lastVersion!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code!: string; // الحقل المستخدَم في الـ URL (مثل efu100)

  @Column({ type: 'text', nullable: true })
  manual!: string;

  @Column({ type: 'text', nullable: true })
  software!: string;

  @Column({ name: 'digital_content', type: 'text', nullable: true })
  digitalContent!: string;

  @Column({ name: 'img_type', type: 'varchar', length: 50, nullable: true })
  imgType!: string;

  @Column({ name: 'video_learning', type: 'text', nullable: true })
  videoLearning!: string;
}