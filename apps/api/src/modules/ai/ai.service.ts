import { Injectable } from '@nestjs/common';
import { ExtractPropertySearchDto } from './dto/extract-property-search.dto';
import { ExplainPropertyMatchesDto } from './dto/explain-property-matches.dto';

type PropertySearchExtraction = {
  location: string;
  budget: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  minArea: number | null;
  maxArea: number | null;
  goal: string;
  mustHave: string[];
  summary: string;
  confidence: number;
};

@Injectable()
export class AiService {
  async extractPropertySearch(
    dto: ExtractPropertySearchDto,
  ): Promise<PropertySearchExtraction> {
    return this.localPropertySearchExtraction(dto.searchText);
  }

  private localPropertySearchExtraction(text: string): PropertySearchExtraction {
    const value = text.toLowerCase();

    const budget = this.extractBudget(value);
    const bedrooms = this.extractBedrooms(value);
    const bathrooms = this.extractBathrooms(value);
    const { minArea, maxArea } = this.extractArea(value);
    const propertyType = this.extractPropertyType(value);
    const location = this.extractLocation(value);
    const goal = this.extractGoal(value);
    const mustHave = this.extractMustHave(value);

    const confidence = this.calculateConfidence({
      budget,
      bedrooms,
      bathrooms,
      minArea,
      maxArea,
      propertyType,
      location,
      goal,
      mustHave,
    });

    return {
      location,
      budget,
      propertyType,
      bedrooms,
      bathrooms,
      minArea,
      maxArea,
      goal,
      mustHave,
      summary: this.buildSummary({
        location,
        budget,
        propertyType,
        bedrooms,
        bathrooms,
        minArea,
        maxArea,
        goal,
        mustHave,
      }),
      confidence,
    };
  }

  private extractBudget(value: string): string {
    const patterns = [
      /(?:under|below|maximum|max|budget|up to|less than)\s*(?:€|eur)?\s*([\d.,]+)\s*(k|m)?/,
      /(?:€|eur)\s*([\d.,]+)\s*(k|m)?/,
      /([\d.,]+)\s*(k|m)\s*(?:€|eur)?/,
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);

      if (match) {
        const raw = match[1].replace(/[,.]/g, '');
        const suffix = match[2];

        let amount = Number(raw);

        if (!Number.isFinite(amount)) return '';

        if (suffix === 'k') amount *= 1000;
        if (suffix === 'm') amount *= 1000000;

        return String(amount);
      }
    }

    return '';
  }

  private extractBedrooms(value: string): string {
    const patterns = [
      /(\d+)\s*[- ]?\s*(bedroom|bedrooms|bed|beds|br)/,
      /(\d+)\s*[- ]?\s*room/,
      /(one|two|three|four|five)\s*[- ]?\s*(bedroom|bedrooms|bed|beds)/,
    ];

    const wordMap: Record<string, string> = {
      one: '1',
      two: '2',
      three: '3',
      four: '4',
      five: '5',
    };

    for (const pattern of patterns) {
      const match = value.match(pattern);

      if (match) {
        return wordMap[match[1]] || match[1];
      }
    }

    if (value.includes('studio')) return '0';

    return '';
  }

  private extractPropertyType(value: string): string {
    if (value.includes('villa')) return 'villa';
    if (value.includes('penthouse')) return 'penthouse';
    if (value.includes('house') || value.includes('home')) return 'house';
    if (value.includes('studio')) return 'studio';
    if (value.includes('apartment') || value.includes('flat')) {
      return 'apartment';
    }

    return 'apartment';
  }

  private extractLocation(value: string): string {
    const locations: Record<string, string> = {
      // Major Portuguese cities
      lisbon: 'Lisbon',
      lisboa: 'Lisbon',
      porto: 'Porto',
      faro: 'Faro',
      braga: 'Braga',
      coimbra: 'Coimbra',
      aveiro: 'Aveiro',
      leiria: 'Leiria',
      setubal: 'Setúbal',
      'setúbal': 'Setúbal',
      evora: 'Évora',
      'évora': 'Évora',
      viseu: 'Viseu',
      santarem: 'Santarém',
      'santarém': 'Santarém',
      portimao: 'Portimão',
      'portimão': 'Portimão',
      lagos: 'Lagos',
      albufeira: 'Albufeira',
      tavira: 'Tavira',

      // Lisbon metropolitan area
      cascais: 'Cascais',
      oeiras: 'Oeiras',
      sintra: 'Sintra',
      amadora: 'Amadora',
      almada: 'Almada',
      loures: 'Loures',
      mafra: 'Mafra',
      'vila franca de xira': 'Vila Franca de Xira',

      // Lisbon neighbourhoods
      benfica: 'Benfica',
      alfama: 'Alfama',
      estrela: 'Estrela',
      alvalade: 'Alvalade',
      lumiar: 'Lumiar',
      belem: 'Belém',
      'belém': 'Belém',
      marvila: 'Marvila',
      arroios: 'Arroios',
      'principe real': 'Príncipe Real',
      'príncipe real': 'Príncipe Real',
      'campo de ourique': 'Campo de Ourique',
      'parque das nações': 'Parque das Nações',
      'parque das nacoes': 'Parque das Nações',
    };

    // Check longer names first to avoid partial matches.
    const entries = Object.entries(locations).sort(
      ([a], [b]) => b.length - a.length,
    );

    for (const [keyword, formattedLocation] of entries) {
      if (value.includes(keyword)) {
        return formattedLocation;
      }
    }

    return 'Portugal';
  }

  private formatLocation(location: string): string {
    const map: Record<string, string> = {
      lisbon: 'Lisbon',
      lisboa: 'Lisbon',
      porto: 'Porto',
      faro: 'Faro',
      braga: 'Braga',
      coimbra: 'Coimbra',
      aveiro: 'Aveiro',
      leiria: 'Leiria',
      setubal: 'Setúbal',
      'setúbal': 'Setúbal',
      evora: 'Évora',
      'évora': 'Évora',
      viseu: 'Viseu',
      santarem: 'Santarém',
      'santarém': 'Santarém',
      portimao: 'Portimão',
      'portimão': 'Portimão',
      lagos: 'Lagos',
      albufeira: 'Albufeira',
      tavira: 'Tavira',
      cascais: 'Cascais',
      oeiras: 'Oeiras',
      sintra: 'Sintra',
      amadora: 'Amadora',
      almada: 'Almada',
      loures: 'Loures',
      mafra: 'Mafra',
      benfica: 'Benfica',
      alfama: 'Alfama',
      estrela: 'Estrela',
      alvalade: 'Alvalade',
      lumiar: 'Lumiar',
      belem: 'Belém',
      'belém': 'Belém',
      marvila: 'Marvila',
      arroios: 'Arroios',
      'principe real': 'Príncipe Real',
      'príncipe real': 'Príncipe Real',
      'campo de ourique': 'Campo de Ourique',
      'parque das nações': 'Parque das Nações',
      'parque das nacoes': 'Parque das Nações',
      'vila franca de xira': 'Vila Franca de Xira',
    };

    return map[location] || 'Portugal';
  }

  private extractGoal(value: string): string {
    if (
      value.includes('invest') ||
      value.includes('investment') ||
      value.includes('rental yield') ||
      value.includes('roi')
    ) {
      return 'invest';
    }

    if (
      value.includes('relocate') ||
      value.includes('relocation') ||
      value.includes('move to') ||
      value.includes('moving to')
    ) {
      return 'relocate';
    }

    if (
      value.includes('retire') ||
      value.includes('retirement') ||
      value.includes('retiring')
    ) {
      return 'retire';
    }

    return 'buy';
  }

  private extractMustHave(value: string): string[] {
    const mustHave: string[] = [];

    const features: { label: string; keywords: string[] }[] = [
      {
        label: 'Near metro',
        keywords: ['metro', 'subway', 'underground'],
      },
      {
        label: 'Near beach',
        keywords: ['beach', 'sea', 'ocean', 'waterfront'],
      },
      {
        label: 'Parking',
        keywords: ['parking', 'garage'],
      },
      {
        label: 'Balcony',
        keywords: ['balcony', 'terrace'],
      },
      {
        label: 'Garden',
        keywords: ['garden', 'yard'],
      },
      {
        label: 'Near schools',
        keywords: ['school', 'schools', 'kindergarten'],
      },
      {
        label: 'Elevator',
        keywords: ['elevator', 'lift'],
      },
      {
        label: 'Renovated',
        keywords: ['renovated', 'modern', 'newly renovated'],
      },
      {
        label: 'Quiet area',
        keywords: ['quiet', 'calm', 'peaceful'],
      },
      {
        label: 'City center',
        keywords: ['city center', 'central', 'downtown'],
      },
      {
        label: 'Sea view',
        keywords: ['sea view', 'ocean view', 'water view'],
      },
      {
        label: 'River view',
        keywords: ['river view', 'tagus view'],
      },
      {
        label: 'Swimming pool',
        keywords: ['pool', 'swimming pool'],
      },
      {
        label: 'Pet friendly',
        keywords: ['pet friendly', 'pets allowed', 'dog friendly'],
      },
      {
        label: 'Home office',
        keywords: ['home office', 'office room', 'workspace'],
      },
      {
        label: 'Energy efficient',
        keywords: ['energy class a', 'solar panels', 'energy efficient'],
      },
      {
        label: 'Near train',
        keywords: ['train station', 'near train', 'railway'],
      },
      {
        label: 'Near airport',
        keywords: ['airport', 'near airport'],
      },
    ];

    for (const feature of features) {
      if (feature.keywords.some((keyword) => value.includes(keyword))) {
        mustHave.push(feature.label);
      }
    }

    return [...new Set(mustHave)];
  }

  private calculateConfidence(data: {
    budget: string;
    bedrooms: string;
    bathrooms: string;
minArea: number | null;
maxArea: number | null;
    propertyType: string;
    location: string;
    goal: string;
    mustHave: string[];
  }): number {
    let score = 40;

    if (data.budget) score += 15;
    if (data.bedrooms) score += 15;
    if (data.propertyType) score += 10;
    if (data.location && data.location !== 'Portugal') score += 10;
    if (data.goal) score += 5;
    if (data.mustHave.length > 0) score += 5;

    return Math.min(score, 100);
  }

  private buildSummary(data: {
  location: string;
  budget: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  minArea: number | null;
  maxArea: number | null;
  goal: string;
  mustHave: string[];
}): string {
  const bedroomText =
    data.bedrooms === '0'
      ? 'studio'
      : data.bedrooms
        ? `${data.bedrooms}-bedroom`
        : '';

  const budgetText = data.budget
    ? ` with a maximum budget of €${Number(data.budget).toLocaleString('en-US')}`
    : '';

  const bathroomText = data.bathrooms
    ? ` The property should have ${data.bathrooms} bathroom${data.bathrooms === '1' ? '' : 's'}.`
    : '';

  let areaText = '';

  if (data.minArea !== null && data.maxArea !== null) {
    areaText =
      ` The requested surface is between ${data.minArea} and ${data.maxArea} m².`;
  } else if (data.minArea !== null) {
    areaText =
      ` The minimum requested surface is ${data.minArea} m².`;
  } else if (data.maxArea !== null) {
    areaText =
      ` The maximum requested surface is ${data.maxArea} m².`;
  }

  const featuresText =
    data.mustHave.length > 0
      ? ` Preferred features include ${data.mustHave.join(', ')}.`
      : '';

  const goalMap: Record<string, string> = {
    buy: 'to live in',
    invest: 'as an investment',
    relocate: 'for relocation',
    retire: 'for retirement',
  };

  return (
    `Buyer is looking for a ${bedroomText} ${data.propertyType} ` +
    `in ${data.location}${budgetText}. ` +
    `The property is intended ${goalMap[data.goal] || 'to buy'}.` +
    bathroomText +
    areaText +
    featuresText
  );
}

private extractBathrooms(value: string): string {
  const match = value.match(
    /(\d+)\s*[- ]?\s*(bathrooms?|baths?)(?!\w)/i,
  );

  return match ? match[1] : '';
}

private extractArea(value: string): {
  minArea: number | null;
  maxArea: number | null;
} {
  const unit = String.raw`(?:m²|m2|sqm|square\s+met(?:er|re)s?|sq\.?\s*m)`;
  const end = String.raw`(?![\w²])`;

  const between = new RegExp(
    String.raw`\bbetween\s+(\d+(?:[.,]\d+)?)\s+(?:and|to)\s+(\d+(?:[.,]\d+)?)\s*${unit}${end}`,
    'i',
  );

  const range = new RegExp(
    String.raw`\b(\d+(?:[.,]\d+)?)\s*(?:-|to)\s*(\d+(?:[.,]\d+)?)\s*${unit}${end}`,
    'i',
  );

  const minimum = new RegExp(
    String.raw`\b(?:at least|minimum|min|over)\s+(\d+(?:[.,]\d+)?)\s*${unit}${end}`,
    'i',
  );

  const maximum = new RegExp(
    String.raw`\b(?:up to|maximum|max|under|below)\s+(\d+(?:[.,]\d+)?)\s*${unit}${end}`,
    'i',
  );

  const parseArea = (raw: string): number | null => {
    const number = Number(raw.replace(',', '.'));

    return Number.isFinite(number) && number > 0
      ? number
      : null;
  };

  const matchedRange = value.match(between) ?? value.match(range);

  if (matchedRange) {
    const minArea = parseArea(matchedRange[1]);
    const maxArea = parseArea(matchedRange[2]);

    if (
      minArea !== null &&
      maxArea !== null &&
      minArea <= maxArea
    ) {
      return { minArea, maxArea };
    }
  }

  const minMatch = value.match(minimum);
  const maxMatch = value.match(maximum);

  const minArea = minMatch ? parseArea(minMatch[1]) : null;
  const maxArea = maxMatch ? parseArea(maxMatch[1]) : null;

  if (
    minArea !== null &&
    maxArea !== null &&
    minArea > maxArea
  ) {
    return { minArea: null, maxArea: null };
  }

  return { minArea, maxArea };
}

}