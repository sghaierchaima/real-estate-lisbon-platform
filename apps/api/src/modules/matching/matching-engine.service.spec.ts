import {
    Lead,
    ProfessionalProfile,
    ProfessionalType,
} from '@prisma/client';

import {
    MatchingEngineService,
} from './matching-engine.service';

type ProfessionalForTest =
    ProfessionalProfile & {
        user: {
            id: string;
            fullName: string | null;
            email: string;
            city: string | null;
            country: string | null;
            avatarUrl: string | null;
        };
    };

describe('MatchingEngineService', () => {
    let service: MatchingEngineService;

    beforeEach(() => {
        service =
            new MatchingEngineService();
    });

    /*
     * ============================================================
     * detectProfessionalType()
     * ============================================================
     */

    describe('detectProfessionalType', () => {
        it('should detect mortgage broker', () => {
            const result =
                service.detectProfessionalType(
                    'Mortgage affordability financing',
                );

            expect(result).toBe(
                ProfessionalType.MORTGAGE_BROKER,
            );
        });

        it('should detect property valuer', () => {
            const result =
                service.detectProfessionalType(
                    'Property valuation price checker',
                );

            expect(result).toBe(
                ProfessionalType.PROPERTY_VALUER,
            );
        });

        it('should detect tax advisor', () => {
            const result =
                service.detectProfessionalType(
                    'True cost IMT stamp duty tax',
                );

            expect(result).toBe(
                ProfessionalType.TAX_ADVISOR,
            );
        });

        it('should detect property lawyer', () => {
            const result =
                service.detectProfessionalType(
                    'Legal lawyer contract assistance',
                );

            expect(result).toBe(
                ProfessionalType.PROPERTY_LAWYER,
            );
        });

        it('should detect home inspector', () => {
            const result =
                service.detectProfessionalType(
                    'Property inspection survey',
                );

            expect(result).toBe(
                ProfessionalType.HOME_INSPECTOR,
            );
        });

        it('should detect insurance broker', () => {
            const result =
                service.detectProfessionalType(
                    'Home insurance coverage',
                );

            expect(result).toBe(
                ProfessionalType.INSURANCE_BROKER,
            );
        });

        it('should default to property agent', () => {
            const result =
                service.detectProfessionalType(
                    'Looking for an apartment in Lisbon',
                );

            expect(result).toBe(
                ProfessionalType.PROPERTY_AGENT,
            );
        });

        it('should be case insensitive', () => {
            const result =
                service.detectProfessionalType(
                    'MORTGAGE FINANCING',
                );

            expect(result).toBe(
                ProfessionalType.MORTGAGE_BROKER,
            );
        });
    });

    /*
     * ============================================================
     * Test factories
     * ============================================================
     */

    const createLead = (
        overrides: Partial<Lead> = {},
    ): Lead => {
        return {
            id: 'lead-1',

            userId:
                'buyer-1',

            fullName:
                'Buyer Test',

            email:
                'buyer@example.com',

            phone:
                null,

            source:
                'Affordability Calculator',

            interest:
                'Mortgage / Affordability Review',

            location:
                'Portugal',

            budget:
                '400000',

            propertyType:
                null,

            bedrooms:
                null,

            bathrooms:
                null,

            minBudget:
                null,

            maxBudget:
                null,

            goal:
                null,

            mustHave:
                [],

            searchText:
                null,

            aiSummary:
                null,

            confidence:
                null,

            isActive:
                true,

            notificationsEnabled:
                true,

            lastMatchedAt:
                null,

            quality:
                'WARM',

            status:
                'NEW',

            createdAt:
                new Date(),

            updatedAt:
                new Date(),

            ...overrides,
        } as Lead;
    };

    const createProfessional = (
        overrides:
            Partial<ProfessionalProfile> = {},
    ): ProfessionalForTest => {
        return {
            id:
                'professional-1',

            userId:
                'professional-user-1',

            professionalType:
                ProfessionalType.MORTGAGE_BROKER,

            companyName:
                'Portugal Home Finance',

            bio:
                'Mortgage specialist operating in Portugal',

            languages:
                ['English'],

            rating:
                4.8,

            reviewsCount:
                25,

            clientsCount:
                100,

            verificationStatus:
                'ACTIVE',

            isFeatured:
                true,

            profileCompletion:
                95,

            createdAt:
                new Date(),

            updatedAt:
                new Date(),

            user: {
                id:
                    'professional-user-1',

                fullName:
                    'Ana Costa',

                email:
                    'ana@example.com',

                city:
                    'Lisbon',

                country:
                    'Portugal',

                avatarUrl:
                    null,
            },

            ...overrides,
        } as ProfessionalForTest;
    };

    /*
     * ============================================================
     * calculateDetailedScore()
     * ============================================================
     */

    describe('calculateDetailedScore', () => {
        it(
            'should return a strong score for a highly compatible professional',
            () => {
                const lead =
                    createLead();

                const professional =
                    createProfessional();

                const result =
                    service.calculateDetailedScore(
                        lead,
                        professional,
                    );

                expect(
                    result.score,
                ).toBeGreaterThanOrEqual(
                    70,
                );

                expect(
                    result.score,
                ).toBeLessThanOrEqual(
                    100,
                );

                expect(
                    result.reasons.length,
                ).toBeGreaterThan(
                    0,
                );
            },
        );

        it(
            'should award specialization points when professional type matches',
            () => {
                const lead =
                    createLead({
                        source:
                            'Affordability Calculator',

                        interest:
                            'Mortgage financing',
                    });

                const professional =
                    createProfessional({
                        professionalType:
                            ProfessionalType.MORTGAGE_BROKER,

                        rating:
                            0,

                        profileCompletion:
                            0,

                        clientsCount:
                            0,

                        isFeatured:
                            false,
                    });

                const result =
                    service.calculateDetailedScore(
                        lead,
                        professional,
                    );

                expect(
                    result.score,
                ).toBeGreaterThanOrEqual(
                    45,
                );

                expect(
                    result.reasons,
                ).toContain(
                    'Professional specialization matches the buyer request',
                );
            },
        );

        it(
            'should not award specialization points for wrong professional type',
            () => {
                const lead =
                    createLead({
                        source:
                            'Affordability Calculator',

                        interest:
                            'Mortgage financing',
                    });

                const professional =
                    createProfessional({
                        professionalType:
                            ProfessionalType.PROPERTY_AGENT,

                        rating:
                            0,

                        profileCompletion:
                            0,

                        clientsCount:
                            0,

                        isFeatured:
                            false,
                    });

                const result =
                    service.calculateDetailedScore(
                        lead,
                        professional,
                    );

                expect(
                    result.reasons,
                ).not.toContain(
                    'Professional specialization matches the buyer request',
                );
            },
        );

        it(
            'should award location points when location is relevant',
            () => {
                const lead =
                    createLead({
                        location:
                            'Portugal',
                    });

                const professional =
                    createProfessional();

                const result =
                    service.calculateDetailedScore(
                        lead,
                        professional,
                    );

                expect(
                    result.reasons,
                ).toContain(
                    'Professional location is relevant to the buyer request',
                );
            },
        );

        it(
            'should not penalize a candidate when lead has no location',
            () => {
                const lead =
                    createLead({
                        location:
                            null,
                    });

                const professional =
                    createProfessional({
                        rating:
                            0,

                        profileCompletion:
                            0,

                        clientsCount:
                            0,

                        isFeatured:
                            false,
                    });

                const result =
                    service.calculateDetailedScore(
                        lead,
                        professional,
                    );

                /*
                 * 45 specialization
                 * +
                 * 15 because no location criterion
                 */
                expect(
                    result.score,
                ).toBeGreaterThanOrEqual(
                    60,
                );
            },
        );

        it(
            'should award higher rating points to highly rated professionals',
            () => {
                const lead =
                    createLead();

                const strongProfessional =
                    createProfessional({
                        rating:
                            4.9,

                        profileCompletion:
                            0,

                        clientsCount:
                            0,

                        isFeatured:
                            false,
                    });

                const weakProfessional =
                    createProfessional({
                        rating:
                            2,

                        profileCompletion:
                            0,

                        clientsCount:
                            0,

                        isFeatured:
                            false,
                    });

                const strongResult =
                    service.calculateDetailedScore(
                        lead,
                        strongProfessional,
                    );

                const weakResult =
                    service.calculateDetailedScore(
                        lead,
                        weakProfessional,
                    );

                expect(
                    strongResult.score,
                ).toBeGreaterThan(
                    weakResult.score,
                );
            },
        );

        it(
            'should award more points to complete professional profiles',
            () => {
                const lead =
                    createLead();

                const completeProfile =
                    createProfessional({
                        rating:
                            0,

                        profileCompletion:
                            95,

                        clientsCount:
                            0,

                        isFeatured:
                            false,
                    });

                const incompleteProfile =
                    createProfessional({
                        rating:
                            0,

                        profileCompletion:
                            20,

                        clientsCount:
                            0,

                        isFeatured:
                            false,
                    });

                const completeResult =
                    service.calculateDetailedScore(
                        lead,
                        completeProfile,
                    );

                const incompleteResult =
                    service.calculateDetailedScore(
                        lead,
                        incompleteProfile,
                    );

                expect(
                    completeResult.score,
                ).toBeGreaterThan(
                    incompleteResult.score,
                );
            },
        );

        it(
            'should award experience points based on clients count',
            () => {
                const lead =
                    createLead();

                const experienced =
                    createProfessional({
                        rating:
                            0,

                        profileCompletion:
                            0,

                        clientsCount:
                            120,

                        isFeatured:
                            false,
                    });

                const beginner =
                    createProfessional({
                        rating:
                            0,

                        profileCompletion:
                            0,

                        clientsCount:
                            0,

                        isFeatured:
                            false,
                    });

                const experiencedResult =
                    service.calculateDetailedScore(
                        lead,
                        experienced,
                    );

                const beginnerResult =
                    service.calculateDetailedScore(
                        lead,
                        beginner,
                    );

                expect(
                    experiencedResult.score,
                ).toBeGreaterThan(
                    beginnerResult.score,
                );
            },
        );

        it(
            'should award points to featured professionals',
            () => {
                const lead =
                    createLead();

                const featured =
                    createProfessional({
                        rating:
                            0,

                        profileCompletion:
                            0,

                        clientsCount:
                            0,

                        isFeatured:
                            true,
                    });

                const normal =
                    createProfessional({
                        rating:
                            0,

                        profileCompletion:
                            0,

                        clientsCount:
                            0,

                        isFeatured:
                            false,
                    });

                const featuredResult =
                    service.calculateDetailedScore(
                        lead,
                        featured,
                    );

                const normalResult =
                    service.calculateDetailedScore(
                        lead,
                        normal,
                    );

                expect(
                    featuredResult.score,
                ).toBeGreaterThan(
                    normalResult.score,
                );
            },
        );

        it(
            'should never return a score greater than 100',
            () => {
                const lead =
                    createLead();

                const professional =
                    createProfessional({
                        rating:
                            5,

                        profileCompletion:
                            100,

                        clientsCount:
                            1000,

                        isFeatured:
                            true,
                    });

                const result =
                    service.calculateDetailedScore(
                        lead,
                        professional,
                    );

                expect(
                    result.score,
                ).toBeLessThanOrEqual(
                    100,
                );
            },
        );

        it(
            'should produce reasons for the strongest matching criteria',
            () => {
                const lead =
                    createLead();

                const professional =
                    createProfessional();

                const result =
                    service.calculateDetailedScore(
                        lead,
                        professional,
                    );

                expect(
                    result.reasons,
                ).toEqual(
                    expect.arrayContaining([
                        'Professional specialization matches the buyer request',
                        'Professional location is relevant to the buyer request',
                    ]),
                );
            },
        );
    });
});