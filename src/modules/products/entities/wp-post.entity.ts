// src/modules/products/entities/wp-post.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('wp_posts')
export class WpPost {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id!: number;

  @Column({ name: 'post_title', type: 'text' })
  title!: string;

  @Column({ name: 'post_type', type: 'varchar', length: 20 })
  postType!: string;

  @Column({ name: 'post_mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ name: 'guid', type: 'text' })
  guid!: string;

  @Column({ name: 'post_parent', type: 'bigint' })
  postParent!: number;
}