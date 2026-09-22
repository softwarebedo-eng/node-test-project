// src/modules/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './entities/product.entity';
import { WpPost } from './entities/wp-post.entity';
import { PmxiImage } from './entities/pmxi-image.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(WpPost)
    private readonly wpPostRepository: Repository<WpPost>,
    @InjectRepository(PmxiImage)
    private readonly pmxiImageRepository: Repository<PmxiImage>,
  ) {}

  async findByCode(code: string) {
    const formattedCode = code.trim().toLowerCase();

    // 1️⃣ البحث عن المنتج
    const product = await this.productRepository.findOne({
      where: { code: formattedCode },
    });

    if (!product) {
      throw new NotFoundException(`المنتج بالكود (${code}) غير موجود`);
    }

    const slugifiedName = product.name.trim().replace(/\s+/g, '-');

    // 2️⃣ جلب ملفات الـ PDF من wp_posts
    const pdfFiles = await this.wpPostRepository.find({
      where: [
        {
          postParent: product.id,
          postType: 'attachment',
          mimeType: 'application/pdf',
        },
        {
          postType: 'attachment',
          mimeType: 'application/pdf',
          guid: Like(`%${slugifiedName}%`),
        },
      ],
      select: { id: true, title: true, guid: true },
    });

    // 3️⃣ جلب الصور عبر JOIN بين wp_pmxi_images و wp_posts
    const images = await this.pmxiImageRepository
      .createQueryBuilder('pmxi')
      .innerJoin(WpPost, 'post', 'post.ID = pmxi.attachment_id')
      .where('pmxi.image_filename LIKE :filename', {
        filename: `%${slugifiedName}%`,
      })
      .select([
        'pmxi.id AS pmxiId',
        'pmxi.attachment_id AS attachmentId',
        'pmxi.image_filename AS filename',
        'post.guid AS url',
      ])
      .getRawMany();


    return {
      id: product.id,
      name: product.name,
      catId: product.catId,
      lastVersion: product.lastVersion,
      code: product.code,
      manual: product.manual,
      software: product.software,
      digitalContent: product.digitalContent,
      imgType: product.imgType,
      videoLearning: product.videoLearning,

      // 📄 ملفات الـ PDF
      pdfFiles: pdfFiles.map((file) => ({
        id: file.id,
        title: file.title,
        url: file.guid,
      })),

      // 🖼️ قائمة الصور المجلوبة من wp_pmxi_images
      images: images.map((img) => ({
        attachmentId: Number(img.attachmentId),
        filename: img.filename,
        url: img.url,
      })),
    };
  }
}