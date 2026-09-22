import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('product')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 🌐 GET /mywebsite/product/efu100
  @Get(':code')
  async getProductByCode(@Param('code') code: string) {
    return this.productsService.findByCode(code);
  }
}