import { Controller, Get, Param, Query } from '@nestjs/common';
import { NeighborhoodsService } from './neighborhoods.service';

@Controller('neighborhoods')
export class NeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  @Get()
  findAll() {
    return this.neighborhoodsService.findAll();
  }

  @Get('recommend')
  recommend(
    @Query()
    query: {
      budgetMax?: string;
      profile?: string;
      goal?: string;
      search?: string;
    },
  ) {
    return this.neighborhoodsService.recommend(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.neighborhoodsService.findOne(id);
  }
}