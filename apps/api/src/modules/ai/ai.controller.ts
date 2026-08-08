import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { ExtractPropertySearchDto } from './dto/extract-property-search.dto';
import { ExplainPropertyMatchesDto } from './dto/explain-property-matches.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('property-search/extract')
  extractPropertySearch(@Body() dto: ExtractPropertySearchDto) {
    return this.aiService.extractPropertySearch(dto);
  }

 
}