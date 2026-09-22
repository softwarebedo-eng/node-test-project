// src/modules/products/entities/pmxi-image.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('wp_pmxi_images')
export class PmxiImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'attachment_id', type: 'bigint' })
  attachmentId!: number;

  @Column({ name: 'image_filename', type: 'text' })
  imageFilename!: string;
}