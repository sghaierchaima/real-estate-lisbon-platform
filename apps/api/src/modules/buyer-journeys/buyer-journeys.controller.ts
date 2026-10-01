import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { BuyerJourneysService } from './buyer-journeys.service';
import { CreateBuyerJourneyDto } from './dto/create-buyer-journey.dto';
import { UpdateBuyerJourneyDto } from './dto/update-buyer-journey.dto';

// ⚠️ adapte uniquement ce chemin si ton JwtAuthGuard
// se trouve ailleurs dans ton projet.
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('buyer-journeys')
@UseGuards(JwtAuthGuard)
export class BuyerJourneysController {
  constructor(
    private readonly buyerJourneysService: BuyerJourneysService,
  ) {}

  private getUserId(req: any): string {
    const userId =
      req.user?.id ??
      req.user?.sub ??
      req.user?.userId;

    if (!userId) {
      throw new UnauthorizedException(
        'Authenticated user could not be identified',
      );
    }

    return userId;
  }

  // POST /buyer-journeys
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateBuyerJourneyDto,
  ) {
    return this.buyerJourneysService.create(
      this.getUserId(req),
      dto,
    );
  }

  // GET /buyer-journeys/me
  @Get('me')
  findMine(@Req() req: any) {
    return this.buyerJourneysService.findMine(
      this.getUserId(req),
    );
  }

  // GET /buyer-journeys/me/:id
  @Get('me/:id')
  findMineById(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.buyerJourneysService.findMineById(
      this.getUserId(req),
      id,
    );
  }

  // PATCH /buyer-journeys/me/:id
  @Patch('me/:id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBuyerJourneyDto,
  ) {
    return this.buyerJourneysService.update(
      this.getUserId(req),
      id,
      dto,
    );
  }

  // DELETE /buyer-journeys/me/:id
  @Delete('me/:id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.buyerJourneysService.remove(
      this.getUserId(req),
      id,
    );
  }
}