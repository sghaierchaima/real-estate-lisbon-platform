import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';

import { CreateAffordabilityLeadDto } from './dto/create-affordability-lead.dto';
import { CreateCalculatorLeadDto } from './dto/create-calculator-lead.dto';
import { CreateNeighborhoodLeadDto } from './dto/create-neighborhood-lead.dto';
import { CreatePriceCheckerDto } from './dto/create-price-checker.dto';
import { CreatePropertySearchLeadDto } from './dto/create-property-search-lead.dto';
import { CreateTrueCostLeadDto } from './dto/create-true-cost-lead.dto';
import { CreateValuationLeadDto } from './dto/create-valuation-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdatePropertyAlertsDto } from './dto/update-property-alerts.dto';

import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
  ) {}

  /*
   * ============================================================
   * BUYER
   * ============================================================
   */

  @Get('me')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.read.own')
  findMine(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.findMine(
      req.user.id,
    );
  }

  @Post('from-calculator')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.create.own')
  createFromCalculator(
    @Body() dto: CreateCalculatorLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.createFromCalculator(
      dto,
      req.user,
    );
  }

  @Post('from-neighborhood-finder')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.create.own')
  createFromNeighborhoodFinder(
    @Body() dto: CreateNeighborhoodLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.createFromNeighborhoodFinder(
      dto,
      req.user,
    );
  }

  @Post('from-property-valuation')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.create.own')
  createFromPropertyValuation(
    @Body() dto: CreateValuationLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.createFromPropertyValuation(
      dto,
      req.user,
    );
  }

  @Post('from-property-search')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.create.own')
  createFromPropertySearch(
    @Body() dto: CreatePropertySearchLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.createFromPropertySearch(
      dto,
      req.user,
    );
  }

  @Post('from-price-checker')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.create.own')
  createFromPriceChecker(
    @Body() dto: CreatePriceCheckerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.createFromPriceChecker(
      dto,
      req.user,
    );
  }

  @Post('from-affordability-calculator')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.create.own')
  createFromAffordabilityCalculator(
    @Body() dto: CreateAffordabilityLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.createFromAffordabilityCalculator(
      dto,
      req.user,
    );
  }

  @Post('from-true-cost-calculator')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.create.own')
  createFromTrueCostCalculator(
    @Body() dto: CreateTrueCostLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.createFromTrueCostCalculator(
      dto,
      req.user,
    );
  }

  @Patch(':id/property-alerts')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.update.own')
  updatePropertyAlerts(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyAlertsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.updatePropertyAlerts(
      id,
      dto.enabled,
      req.user,
    );
  }

  /*
   * ============================================================
   * ADMIN — MONITORING ONLY
   * ============================================================
   */

  @Get()
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.read.all')
  findAll(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.findAll(
      req.user,
    );
  }

  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.read.all')
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.findOne(
      id,
      req.user,
    );
  }

  /*
   * On conserve PATCH pour les actions administratives
   * exceptionnelles.
   *
   * Mais le service empêchera l'Admin de définir
   * MATCHED manuellement.
   */
  @Patch(':id')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.update(
      id,
      dto,
      req.user,
    );
  }

  @Delete(':id')
  @UseGuards(
    JwtAuthGuard,
    PermissionsGuard,
  )
  @Permissions('leads.delete')
  remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.remove(
      id,
      req.user,
    );
  }
}