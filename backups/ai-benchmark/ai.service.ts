import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ExtractPropertySearchDto } from './dto/extract-property-search.dto';
import { ExplainPropertyMatchesDto } from './dto/explain-property-matches.dto';

type PropertySearchExtraction = {
  location: string;
  budget: string;
  minBudget: number | null;
  maxBudget: number | null;
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
  /*  async extractPropertySearch(
     dto: ExtractPropertySearchDto,
   ): Promise<PropertySearchExtraction> {
     return this.localPropertySearchExtraction(dto.searchText);
   } */
  async extractPropertySearch(
    dto: ExtractPropertySearchDto,
  ): Promise<PropertySearchExtraction> {
    const text = dto.searchText?.trim();

    if (!text) {
      throw new BadRequestException('Search text is required');
    }

    if (text.length > 2000) {
      throw new BadRequestException('Search text is too long');
    }

    const provider = process.env.AI_EXTRACTION_PROVIDER ?? 'ollama';

    if (provider === 'regex') {
      return this.localPropertySearchExtraction(text);
    }

    if (provider !== 'ollama') {
      throw new ServiceUnavailableException(
        'Invalid AI extraction provider',
      );
    }

    return this.extractWithOllama(text);
  }


  private readonly logger = new Logger(AiService.name);

  private async extractWithOllama(
    text: string,
  ): Promise<PropertySearchExtraction> {
    const baseUrl = (
      process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434'
    ).replace(/\/$/, '');

    const model = process.env.OLLAMA_MODEL ?? 'qwen2.5:1.5b';

    const fields = {
      location: { type: 'string' },
      minBudget: { type: ['number', 'null'] },
      maxBudget: { type: ['number', 'null'] },
      propertyType: { type: 'string' },
      bedrooms: { type: 'string' },
      bathrooms: { type: 'string' },
      minArea: { type: ['number', 'null'] },
      maxArea: { type: ['number', 'null'] },
      goal: { type: 'string' },
      mustHave: {
        type: 'array',
        items: { type: 'string' },
      },
    };

    const schema = {
      type: 'object',
      properties: fields,
      required: Object.keys(fields),
      additionalProperties: false,
    };

    const prompt = `
You extract real-estate search criteria for properties in Portugal.

Return only the requested JSON structure.

Rules:
- Extract only information supported by the user's request.
- Never invent a budget, room count, surface, or amenity.
- Understand English, French, and Portuguese.
- Recognize Portuguese T0, T1, T2, T3 property notation.
- Use null for missing numeric limits.
- Use "" for missing bedrooms or bathrooms.
- Use "" for an unspecified property type.
- Use "Portugal" when no location is specified.
- Return bedroom and bathroom counts as strings.
- propertyType: apartment, house, villa, studio, penthouse, or "".
- goal: buy, invest, relocate, or retire.
- Default goal to buy if no other goal is stated.
- mustHave must be an array of positive requirements.
- Do not include negated features.
- Use these labels for recognized amenities:
  Parking, Balcony, Garden, Elevator, Near metro,
  Near beach, Near schools, Renovated, Quiet area,
  City center, Sea view, River view, Swimming pool,
  Pet friendly, Home office, Energy efficient,
  Near train, Near airport.
- A maximum budget is not a minimum budget.
- An exact amount may be represented by equal min/max values
  only if the user explicitly requires that exact amount.

  Examples:

Input: "Apartment in Lisbon under 300000 euros"
Output:
{"location":"Lisbon","minBudget":null,"maxBudget":300000,
"propertyType":"apartment","bedrooms":"","bathrooms":"",
"minArea":null,"maxArea":null,"goal":"buy","mustHave":[]}

Input: "House in Porto above 200000 euros"
Output:
{"location":"Porto","minBudget":200000,"maxBudget":null,
"propertyType":"house","bedrooms":"","bathrooms":"",
"minArea":null,"maxArea":null,"goal":"buy","mustHave":[]}

Input: "T2 in Cascais between 250000 and 400000 euros with parking"
Output:
{"location":"Cascais","minBudget":250000,"maxBudget":400000,
"propertyType":"apartment","bedrooms":"2","bathrooms":"",
"minArea":null,"maxArea":null,"goal":"buy",
"mustHave":["Parking"]}


Additional extraction rules:

BUDGET VS AREA:
- "budget maximum", "moins de", "au maximum",
  "por menos de", "até", "no máximo", "up to",
  "under", "below" mean maxBudget only.
- "at least", "minimum price", "a partir de",
  "pelo menos" mean minBudget only.
- If a number is followed by m², m2 or sqm,
  it refers to area, NEVER to money.
- "between 90 and 140 m²" means:
  minArea=90, maxArea=140,
  minBudget=null, maxBudget=null.
- "180k" means 180000.
- "280 mil euros" means 280000.
- Do not set minBudget equal to maxBudget
  for expressions such as "up to" or "under".

PORTUGUESE PROPERTY TYPES:
- moradia = house
- apartamento = apartment
- vivenda = house
- T0 = studio, bedrooms="0"
- T1 = apartment, bedrooms="1"
- T2 = apartment, bedrooms="2"
- T3 = apartment, bedrooms="3"
- studio = studio, bedrooms="0"

MULTILINGUAL AMENITIES:
- balcon, varanda, balcony = Balcony
- jardin, jardim, garden = Garden
- garage, garagem, parking = Parking
- ascenseur, elevador, elevator = Elevator
- piscine, piscina, swimming pool = Swimming pool
- métro, metro, subway = Near metro
- rénové, renovado, renovated = Renovated
- Include all positively requested amenities.
- Never include explicitly excluded amenities.

Examples:

Input: "Je cherche un appartement T3 à Benfica,
budget maximum 350 000 euros, avec balcon."
Output:
{"location":"Benfica","minBudget":null,"maxBudget":350000,
"propertyType":"apartment","bedrooms":"3","bathrooms":"",
"minArea":null,"maxArea":null,"goal":"buy",
"mustHave":["Balcony"]}

Input: "Quero uma moradia em Oeiras entre
300 mil e 450 mil euros, com jardim."
Output:
{"location":"Oeiras","minBudget":300000,"maxBudget":450000,
"propertyType":"house","bedrooms":"","bathrooms":"",
"minArea":null,"maxArea":null,"goal":"buy",
"mustHave":["Garden"]}

Input: "Find a 3-bedroom apartment in Braga,
between 90 and 140 m², with 2 bathrooms and an elevator."
Output:
{"location":"Braga","minBudget":null,"maxBudget":null,
"propertyType":"apartment","bedrooms":"3","bathrooms":"2",
"minArea":90,"maxArea":140,"goal":"buy",
"mustHave":["Elevator"]}

Input: "I want to invest in a renovated studio
in Alfama near the metro, for up to 180k euros."
Output:
{"location":"Alfama","minBudget":null,"maxBudget":180000,
"propertyType":"studio","bedrooms":"0","bathrooms":"",
"minArea":null,"maxArea":null,"goal":"invest",
"mustHave":["Renovated","Near metro"]}
- Return only canonical amenity labels from the allowed list.
- Never output "Garage" or "Garagem"; output "Parking".
- Never output "Jardin" or "Jardim"; output "Garden".
- Never output "Varanda" or "Balcon"; output "Balcony".
- Do not translate canonical amenity labels into French or Portuguese.

IMPORTANT GOAL RULES:
- The default goal is ALWAYS "buy".
- Do not infer "invest" from a high price, villa,
  garden, swimming pool, or property location.
- Use "invest" ONLY when the user explicitly mentions
  investing, investment, rental yield, ROI, or
  an equivalent expression in French or Portuguese.
- Use "relocate" ONLY for an explicit relocation intention.
- Use "retire" ONLY for an explicit retirement intention.
- If the user's intention is not explicit, use "buy".

IMPORTANT PORTUGUESE BUDGET RULE:
- "por menos de 280 mil euros" means:
  minBudget=null, maxBudget=280000.
- "menos de" means a maximum, never a minimum.
- "mais de" means a minimum, never a maximum.
- "até 280 mil euros" means:
  minBudget=null, maxBudget=280000.

Examples:

Input: "Looking for a house in Porto costing
at least 200000 euros, with a garden."
Output:
{"location":"Porto","minBudget":200000,"maxBudget":null,
"propertyType":"house","bedrooms":"","bathrooms":"",
"minArea":null,"maxArea":null,"goal":"buy",
"mustHave":["Garden"]}

Input: "Procuro um apartamento T2 em Almada
por menos de 280 mil euros, com garagem."
Output:
{"location":"Almada","minBudget":null,"maxBudget":280000,
"propertyType":"apartment","bedrooms":"2","bathrooms":"",
"minArea":null,"maxArea":null,"goal":"buy",
"mustHave":["Parking"]}

User request:
${JSON.stringify(text)}
`;

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          format: schema,
          options: {
            temperature: 0,
            num_predict: 350,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }

      const result: unknown = await response.json();

      if (
        !this.isRecord(result) ||
        typeof result.response !== 'string'
      ) {
        throw new Error('Invalid Ollama API response');
      }

      const parsed: unknown = JSON.parse(result.response);

      try {
        return this.normalizeLlmExtraction(parsed);
      } catch (error) {
        this.logger.warn(
          `LLM validation failed: ${error instanceof Error ? error.message : String(error)
          }`,
        );

        throw error;
      }
    } catch (error) {
      this.logger.error(
        'Ollama extraction failed',
        error instanceof Error ? error.stack : String(error),
      );

      throw new ServiceUnavailableException(
        'AI extraction is temporarily unavailable',
      );
    }
  }

  private isRecord(
    value: unknown,
  ): value is Record<string, unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    );
  }

  private normalizeLlmExtraction(
    value: unknown,
  ): PropertySearchExtraction {
    if (!this.isRecord(value)) {
      throw new Error('Extraction must be a JSON object');
    }

    const stringField = (key: string): string => {
      const item = value[key];

      if (typeof item !== 'string') {
        throw new Error(`Invalid string field: ${key}`);
      }

      return item.trim();
    };

    const numberField = (key: string): number | null => {
      const item = value[key];

      if (item === null) return null;

      if (
        typeof item !== 'number' ||
        !Number.isFinite(item) ||
        item <= 0
      ) {
        throw new Error(`Invalid numeric field: ${key}`);
      }

      return item;
    };

    const minBudget = numberField('minBudget');
    const maxBudget = numberField('maxBudget');
    const minArea = numberField('minArea');
    const maxArea = numberField('maxArea');

    if (
      (minBudget !== null &&
        maxBudget !== null &&
        minBudget > maxBudget) ||
      (minArea !== null &&
        maxArea !== null &&
        minArea > maxArea)
    ) {
      throw new Error('Inconsistent search ranges');
    }

    const location = stringField('location') || 'Portugal';

    const allowedTypes = [
      'apartment',
      'house',
      'villa',
      'studio',
      'penthouse',
      '',
    ];

    const rawType = stringField('propertyType').toLowerCase();

    if (!allowedTypes.includes(rawType)) {
      throw new Error('Invalid property type');
    }

    const rawGoal = stringField('goal').toLowerCase();

    if (!['buy', 'invest', 'relocate', 'retire'].includes(rawGoal)) {
      throw new Error('Invalid search goal');
    }

  
let bedrooms = stringField('bedrooms');
const bathrooms = stringField('bathrooms');

const normalizedType = rawType.toLowerCase();

// A zero-bedroom property must be explicitly indicated.
// Do not interpret an unspecified bedroom count as zero.
if (bedrooms === '0' && normalizedType !== 'studio') {
  bedrooms = '';
}


    if (
      !/^(\d{1,2})?$/.test(bedrooms) ||
      !/^(\d{1,2})?$/.test(bathrooms)
    ) {
      throw new Error('Invalid room count');
    }

    const rawFeatures = value.mustHave;

    if (
      !Array.isArray(rawFeatures) ||
      !rawFeatures.every((item) => typeof item === 'string')
    ) {
      throw new Error('Invalid mustHave array');
    }

    const allowedFeatures = [
      'Near metro',
      'Near beach',
      'Parking',
      'Balcony',
      'Garden',
      'Near schools',
      'Elevator',
      'Renovated',
      'Quiet area',
      'City center',
      'Sea view',
      'River view',
      'Swimming pool',
      'Pet friendly',
      'Home office',
      'Energy efficient',
      'Near train',
      'Near airport',
    ];


    const featureAliases: Record<string, string> = {
      garage: 'Parking',
      garagem: 'Parking',
      stationnement: 'Parking',
      parking: 'Parking',

      balcon: 'Balcony',
      varanda: 'Balcony',

      jardin: 'Garden',
      jardim: 'Garden',

      ascenseur: 'Elevator',
      elevador: 'Elevator',

      piscine: 'Swimming pool',
      piscina: 'Swimming pool',

      métro: 'Near metro',
      metro: 'Near metro',

      rénové: 'Renovated',
      renovado: 'Renovated',
    };

    const mustHave = [
      ...new Set(
        rawFeatures.map((feature: string) => {
          const normalized = feature.trim().toLowerCase();

          const canonical =
            allowedFeatures.find(
              (allowed) => allowed.toLowerCase() === normalized,
            ) ?? featureAliases[normalized];

          if (!canonical) {
            throw new Error(`Unknown feature: ${feature}`);
          }

          return canonical;
        }),
      ),
    ];


    const budget =
      maxBudget !== null ? String(maxBudget) : '';

    const propertyType = rawType;
    const goal = rawGoal;

    const data = {
      location,
      budget,
      minBudget,
      maxBudget,
      propertyType,
      bedrooms,
      bathrooms,
      minArea,
      maxArea,
      goal,
      mustHave,
    };

    return {
      ...data,
      summary: this.buildSummary(data),
      confidence: this.calculateConfidence(data),
    };
  }


  private localPropertySearchExtraction(text: string): PropertySearchExtraction {
    const value = text.toLowerCase();

    const { minBudget, maxBudget } = this.extractBudgetRange(value);

    const budget =
      maxBudget !== null ? String(maxBudget) : '';
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
      minBudget,
      maxBudget,
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
        minBudget,
        maxBudget,
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

  private extractBudgetRange(value: string): {
    minBudget: number | null;
    maxBudget: number | null;
  } {
    const money = String.raw`(?:€\s*|eur\s*)?(\d[\d.,\s]*)(?:\s*(k|m))?`;

    const pattern = new RegExp(
      String.raw`\bbetween\s+${money}\s+and\s+${money}`,
      'i',
    );

    const match = value.match(pattern);

    const parseAmount = (
      raw: string,
      suffix?: string,
    ): number | null => {
      const normalized = raw.replace(/[\s,.]/g, '');
      let amount = Number(normalized);

      if (!Number.isFinite(amount) || amount <= 0) {
        return null;
      }

      if (suffix?.toLowerCase() === 'k') {
        amount *= 1000;
      }

      if (suffix?.toLowerCase() === 'm') {
        amount *= 1000000;
      }

      return amount;
    };

    if (match) {
      const minBudget = parseAmount(match[1], match[2]);
      const maxBudget = parseAmount(match[3], match[4]);

      if (
        minBudget !== null &&
        maxBudget !== null &&
        minBudget <= maxBudget
      ) {
        return { minBudget, maxBudget };
      }
    }

    const singleBudget = this.extractBudget(value);

    return {
      minBudget: null,
      maxBudget: singleBudget ? Number(singleBudget) : null,
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
    minBudget: number | null;
    maxBudget: number | null;
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
    ? ''
    : data.bedrooms
      ? `${data.bedrooms}-bedroom`
      : '';

    const formatEuro = (amount: number) =>
      `€${amount.toLocaleString('en-US')}`;

    const budgetText =
      data.minBudget !== null && data.maxBudget !== null
        ? ` with a budget between ${formatEuro(data.minBudget)} and ${formatEuro(data.maxBudget)}`
        : data.maxBudget !== null
          ? ` with a maximum budget of ${formatEuro(data.maxBudget)}`
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