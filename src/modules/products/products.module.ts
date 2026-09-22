import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { WpPost } from './entities/wp-post.entity';
import { PmxiImage } from './entities/pmxi-image.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Product, WpPost, PmxiImage])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}