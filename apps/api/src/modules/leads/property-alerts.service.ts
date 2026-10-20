import {
    Injectable,
} from '@nestjs/common';

import {
    NotificationType,
} from '@prisma/client';

import {
    PrismaService,
} from '../../database/prisma.service';

@Injectable()
export class PropertyAlertsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async checkNewProperty(
        propertyId: string,
    ) {
        const property =
            await this.prisma.property.findUnique({
                where: {
                    id: propertyId,
                },
                include: {
                    professionalProfile: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

        if (
            !property ||
            property.status !== 'PUBLISHED'
        ) {
            return {
                matchedSearches: 0,
                notificationsCreated: 0,
            };
        }

        const searches =
            await this.prisma.lead.findMany({
                where: {
                    source:
                        'Property Search Assistant',

                    isActive:
                        true,

                    notificationsEnabled:
                        true,

                    userId: {
                        not: null,
                    },

                    searchText: {
                        not: null,
                    },
                },
            });

        let notificationsCreated = 0;
        let matchedSearches = 0;

       for (const lead of searches) {
    if (!lead.userId) {
        continue;
    }

    // Mandatory price and surface constraints
    const price = Number(property.price);
    const area = property.area;

    if (
        lead.minBudget != null &&
        (!Number.isFinite(price) || price < lead.minBudget)
    ) {
        continue;
    }

    if (
        lead.maxBudget != null &&
        (!Number.isFinite(price) || price > lead.maxBudget)
    ) {
        continue;
    }

    if (
        lead.minArea != null &&
        (area == null || area < lead.minArea)
    ) {
        continue;
    }

    if (
        lead.maxArea != null &&
        (area == null || area > lead.maxArea)
    ) {
        continue;
    }

    const result =
        this.calculateMatch(
            property,
            lead,
        );

            if (result.score < 70) {
                continue;
            }

            matchedSearches += 1;

            const existing =
                await this.prisma.notification.findFirst({
                    where: {
                        userId: lead.userId,

                        type:
                            NotificationType.PROPERTY_MATCH,

                        propertyId:
                            property.id,

                        leadId:
                            lead.id,
                    },
                });

            if (existing) {
                continue;
            }

            await this.prisma.notification.create({
                data: {
                    userId: lead.userId,

                    type:
                        NotificationType.PROPERTY_MATCH,

                    title:
                        'New property matches your search',

                    message:
                        `${property.title} matches ${result.score}% of your saved property search.`,

                    propertyId:
                        property.id,

                    leadId:
                        lead.id,
                },
            });

            await this.prisma.lead.update({
                where: {
                    id: lead.id,
                },
                data: {
                    lastMatchedAt:
                        new Date(),
                },
            });

            notificationsCreated += 1;
        }

        return {
            matchedSearches,
            notificationsCreated,
        };
    }

    private calculateMatch(
        property: {
            location: string | null;
            region: string | null;
            city: string | null;
            price: number;
            propertyType: string | null;
            bedrooms: number | null;
            bathrooms: number | null;
            equipments: string[];
        },
        lead: {
            location: string | null;
            maxBudget: number | null;
            propertyType: string | null;
            bedrooms: number | null;
            bathrooms: number | null;
            mustHave: string[];
        },
    ) {
        let score = 0;
        let totalWeight = 0;

        // LOCATION = 30
        if (lead.location) {
            totalWeight += 30;

            const wantedLocation =
                lead.location
                    .trim()
                    .toLowerCase();

            const propertyLocations = [
                property.location,
                property.city,
                property.region,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            if (
                propertyLocations.includes(
                    wantedLocation,
                ) ||
                wantedLocation.includes(
                    property.city
                        ?.toLowerCase() || '',
                )
            ) {
                score += 30;
            }
        }

        // BUDGET = 25
        if (
            lead.maxBudget &&
            lead.maxBudget > 0
        ) {
            totalWeight += 25;

            if (
                property.price <=
                lead.maxBudget
            ) {
                score += 25;
            }
        }

        // PROPERTY TYPE = 20
        if (lead.propertyType) {
            totalWeight += 20;

            if (
                property.propertyType
                    ?.toLowerCase() ===
                lead.propertyType
                    .toLowerCase()
            ) {
                score += 20;
            }
        }

        // BEDROOMS = 15
        if (
            lead.bedrooms !== null &&
            lead.bedrooms !== undefined
        ) {
            totalWeight += 15;

            if (
                Number(
                    property.bedrooms || 0,
                ) >= lead.bedrooms
            ) {
                score += 15;
            }
        }

        // MUST HAVE = 10
        if (
            lead.mustHave?.length
        ) {
            totalWeight += 10;

            const equipments =
                property.equipments.map(
                    (item) =>
                        item.toLowerCase(),
                );

            const matchedMustHave =
                lead.mustHave.filter(
                    (wanted) =>
                        equipments.some(
                            (equipment) =>
                                equipment.includes(
                                    wanted.toLowerCase(),
                                ) ||
                                wanted
                                    .toLowerCase()
                                    .includes(equipment),
                        ),
                );

            score +=
                10 *
                (matchedMustHave.length /
                    lead.mustHave.length);
        }

        if (totalWeight === 0) {
            return {
                score: 0,
            };
        }

        return {
            score: Math.round(
                (score / totalWeight) *
                100,
            ),
        };
    }
}