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
    const text = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Remove area values before looking for prices.
    const withoutArea = text.replace(
      /\d+(?:[.,]\d+)?\s*(?:m²|m2|sqm|sq\.?\s*m|square\s+(?:meters?|metres?))/g,
      ' ',
    );

    const amountPattern =
      String.raw`(\d{1,3}(?:[ .,\u00a0]\d{3})+|\d+(?:[.,]\d+)?)`;

    const multiplierPattern =
      String.raw`(?:milhoes|milhao|millions?|mille|thousand|mil|k|m)`;

    const moneyRegex = new RegExp(
      String.raw`(?:€\s*)?${amountPattern}\s*(${multiplierPattern})?\s*(?:€|euros?|eur)?(?![\p{L}\p{N}])`,
      'giu',
    );

    const parseMoney = (
      raw: string,
      multiplier = '',
    ): number | null => {
      const cleaned = raw.replace(/\s/g, '');

      let amount: number;

      if (/^\d{1,3}(?:[.,]\d{3})+$/.test(cleaned)) {
        amount = Number(cleaned.replace(/[.,]/g, ''));
      } else {
        amount = Number(cleaned.replace(',', '.'));
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        return null;
      }

      if (/^(k|mil|mille|thousand)$/.test(multiplier)) {
        amount *= 1000;
      } else if (
        /^(m|milhao|milhoes|million|millions)$/.test(multiplier)
      ) {
        amount *= 1000000;
      }

      return amount;
    };

    const tokens: Array<{
      start: number;
      end: number;
      amount: number;
    }> = [];

    for (const match of withoutArea.matchAll(moneyRegex)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const raw = match[1];
      const multiplier = match[2] ?? '';

      const hasCurrency =
        /€|\beuros?\b|\beur\b/.test(match[0]);

      const hasMultiplier = multiplier.length > 0;

      if (!hasCurrency && !hasMultiplier) {
        continue;
      }

      const amount = parseMoney(raw, multiplier);

      if (amount !== null) {
        tokens.push({ start, end, amount });
      }
    }

    // French monetary intervals with currency only at the end.
    // Examples:
    // "entre 360 000 et 520 000 euros"
    // "budget compris entre 165 000 et 245 000 €"
    const frenchInterval = withoutArea.match(
      /\b(?:entre|compris entre)\s+(\d{1,3}(?:[ .]\d{3})+)\s+et\s+(\d{1,3}(?:[ .]\d{3})+)\s*(?:€|euros?\b|eur\b)/i,
    );

    if (frenchInterval) {
      const min = Number(frenchInterval[1].replace(/\s/g, ''));
      const max = Number(frenchInterval[2].replace(/\s/g, ''));

      if (
        Number.isFinite(min) &&
        Number.isFinite(max) &&
        min <= max
      ) {
        return {
          minBudget: min,
          maxBudget: max,
        };
      }
    }

    if (tokens.length === 0) {
      return { minBudget: null, maxBudget: null };
    }

    // Monetary interval: between X and Y, X to Y, entre X et Y.
    if (tokens.length >= 2) {
      const first = tokens[0];
      const second = tokens[1];

      const prefix = withoutArea.slice(
        Math.max(0, first.start - 50),
        first.start,
      );

      const separator = withoutArea
        .slice(first.end, second.start)
        .trim();

      const explicitRange =
        /\b(?:between|entre|price range of|range of|faixa de precos?)\s*$/i
          .test(prefix);

      const validSeparator =
        /^(?:to|and|et|e|a|-|–|—)$/i.test(separator);

      if (
        validSeparator &&
        (explicitRange ||
          /^(?:to|a|-|–|—)$/i.test(separator)) &&
        first.amount <= second.amount
      ) {
        return {
          minBudget: first.amount,
          maxBudget: second.amount,
        };
      }
    }

    const token = tokens[0];

    // Only inspect the clause immediately preceding the amount.
    const prefix = withoutArea
      .slice(Math.max(0, token.start - 80), token.start)
      .split(/[,;.!?]/)
      .pop()
      ?.trimEnd() ?? '';

    const maximumPatterns: RegExp[] = [
      /\bno more than\s*$/i,
      /\bnot more than\s*$/i,
      /\bup to\s*$/i,
      /\b(?:under|below|less than|at most)\s*$/i,
      /\b(?:maximum|max|budget maximum)\s*$/i,
      /\b(?:moins de|au maximum|au plus)\s*$/i,
      /\b(?:jusqu'a|pas plus de|inferieur a)\s*$/i,
      /\bne depassant pas\s*$/i,
      /\b(?:ate|menos de|no maximo|abaixo de)\s*$/i,
      /\blimite (?:e|de)\s*$/i,
    ];

    const minimumPatterns: RegExp[] = [
      /\b(?:at least|above|over|more than)\s*$/i,
      /\b(?:minimum|min|greater than)\s*$/i,
      /\b(?:au moins|plus de|minimum de)\s*$/i,
      /\b(?:a partir de|superieur a)\s*$/i,
      /\b(?:pelo menos|mais de|acima de)\s*$/i,
      /\b(?:commence a|commencant a)\s*$/i,
      /\bminimum purchase price is\s*$/i,
    ];

    const matchesAny = (patterns: RegExp[]): boolean =>
      patterns.some((pattern) => pattern.test(prefix));

    // Maximum takes priority for "no more than".
    if (matchesAny(maximumPatterns)) {
      return {
        minBudget: null,
        maxBudget: token.amount,
      };
    }

    if (matchesAny(minimumPatterns)) {
      return {
        minBudget: token.amount,
        maxBudget: null,
      };
    }

    // Do not invent a limit when the price is ambiguous.
    return {
      minBudget: null,
      maxBudget: null,
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
    const text = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const tNotation = text.match(/\bt(\d{1,2})\b/);
    if (tNotation) {
      return tNotation[1];
    }

    if (/\b(studio|estudio)\b/.test(text)) {
      return '0';
    }

    const numeric = text.match(
      /\b(\d{1,2})\s*[- ]?\s*(?:bedrooms?|beds?|br|chambres?|quartos?|dormitorios?)\b/,
    );

    if (numeric) {
      return numeric[1];
    }

    const words: Record<string, string> = {
      one: '1',
      two: '2',
      three: '3',
      four: '4',
      five: '5',
      un: '1',
      une: '1',
      deux: '2',
      trois: '3',
      quatre: '4',
      cinq: '5',
      um: '1',
      uma: '1',
      dois: '2',
      duas: '2',
      tres: '3',
      quatro: '4',
      cinco: '5',
    };

    const written = text.match(
      /\b(one|two|three|four|five|un|une|deux|trois|quatre|cinq|um|uma|dois|duas|tres|quatro|cinco)\s*[- ]\s*(?:bedrooms?|chambres?|quartos?|dormitorios?)\b/,
    );

    return written ? words[written[1]] : '';
  }




  private extractPropertyType(value: string): string {
    const text = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Penthouse: EN / PT
    if (/\b(penthouses?|coberturas?)\b/.test(text)) {
      return 'penthouse';
    }

    // Studio: EN / FR / PT
    if (/\b(studios?|estudios?|t0)\b/.test(text)) {
      return 'studio';
    }

    // Villa: EN / FR
    if (/\b(villas?)\b/.test(text)) {
      return 'villa';
    }

    // House: EN / FR / PT
    if (
      /\b(houses?|home|maisons?|moradias?|vivendas?|casas?)\b/.test(text)
    ) {
      return 'house';
    }

    // Apartment: EN / FR / PT
    if (
      /\b(apartments?|flats?|appartements?|apartamentos?|t[1-9]\d?)\b/.test(
        text,
      )
    ) {
      return 'apartment';
    }

    return '';
  }



  private extractLocation(value: string): string {
    const locations: Record<string, string> = {
      // Major Portuguese cities
      lisbon: 'Lisbon',
      lisboa: 'Lisbon',
      lisbonne: 'Lisbon',
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


    const normalizedText = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    for (const [keyword, formattedLocation] of entries) {
      const normalizedKeyword = keyword
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const escapedKeyword = normalizedKeyword.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );

      const pattern = new RegExp(
        String.raw`(?<![\p{L}\p{N}])${escapedKeyword}(?![\p{L}\p{N}])`,
        'iu',
      );

      if (pattern.test(normalizedText)) {
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
    const text = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Investment intention: EN / FR / PT
    const investmentPatterns: RegExp[] = [
      /\binvest(?:ment|ments|ing|or|ors|ir|issement|issements|imento|imentos)?\b/i,
      /\brental yield\b/i,
      /\brental income\b/i,
      /\breturn on investment\b/i,
      /\broi\b/i,
      /\brendement locatif\b/i,
      /\brevenus locatifs\b/i,
      /\binvestissement locatif\b/i,
      /\brendimento(?:s)?\b/i,
      /\brenda(?:s)?\s+(?:mensal|mensais|de aluguer|de arrendamento)\b/i,
    ];

    // Relocation intention: EN / FR / PT
    const relocationPatterns: RegExp[] = [
      /\brelocat(?:e|es|ed|ing|ion)\b/i,
      /\bmov(?:e|es|ed|ing) to\b/i,
      /\bmove (?:my family|our family) to\b/i,
      /\bsettle in\b/i,
      /\bnous installer\b/i,
      /\bm'installer\b/i,
      /\bs'installer\b/i,
      /\bje souhaite m'installer\b/i,
      /\bdemenag(?:er|ement|e|eons)\b/i,
      /\bchanger de ville\b/i,
      /\bmudar-me\b/i,
      /\bmudar-nos\b/i,
      /\bmudar para\b/i,
      /\bmudar(?:-se)? para\b/i,
      /\bvou mudar\b/i,
      /\bmudanca de residencia\b/i,
    ];

    // Retirement intention: EN / FR / PT
    const retirementPatterns: RegExp[] = [
      /\bretir(?:e|es|ed|ing|ement)\b/i,
      /\bretraite\b/i,
      /\bpartir a la retraite\b/i,
      /\bpour ma retraite\b/i,
      /\bpour notre retraite\b/i,
      /\breforma\b/i,
      /\baposentadoria\b/i,
      /\baposentar(?:-me|-se)?\b/i,
    ];

    const matchesAny = (patterns: RegExp[]): boolean =>
      patterns.some((pattern) => pattern.test(text));

    // Specific life goals take priority over generic purchase intent.
    if (matchesAny(retirementPatterns)) {
      return 'retire';
    }

    if (matchesAny(relocationPatterns)) {
      return 'relocate';
    }

    if (matchesAny(investmentPatterns)) {
      return 'invest';
    }

    return 'buy';
  }




  private extractMustHave(value: string): string[] {
    const text = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    const features: Array<{
      label: string;
      keywords: string[];
    }> = [
        {
          label: 'Near metro',
          keywords: [
            'metro',
            'subway',
            'underground',
            'station de metro',
            'estacao de metro',
          ],
        },
        {
          label: 'Near beach',
          keywords: [
            'near beach',
            'near the beach',
            'close to beach',
            'close to the beach',
            'pres de la plage',
            'proche de la plage',
            'a proximite de la plage',
            'perto da praia',
            'proximo da praia',
          ],
        },
        {
          label: 'Parking',
          keywords: [
            'parking',
            'garage',
            'garagem',
            'estacionamento',
            'stationnement',
            'car park',
          ],
        },
        {
          label: 'Balcony',
          keywords: [
            'balcony',
            'balcon',
            'varanda',
            'terrace',
            'terrasse',
            'terraco',
          ],
        },
        {
          label: 'Garden',
          keywords: [
            'garden',
            'yard',
            'jardin',
            'jardim',
          ],
        },
        {
          label: 'Near schools',
          keywords: [
            'near school',
            'near schools',
            'close to school',
            'close to schools',
            'pres des ecoles',
            'proche des ecoles',
            'perto da escola',
            'perto das escolas',
            'perto de escolas',
          ],
        },
        {
          label: 'Elevator',
          keywords: [
            'elevator',
            'lift',
            'ascenseur',
            'elevador',
          ],
        },
        {
          label: 'Renovated',
          keywords: [
            'renovated',
            'newly renovated',
            'renove',
            'renovee',
            'renovado',
            'renovada',
          ],
        },
        {
          label: 'Quiet area',
          keywords: [
            'quiet',
            'quiet area',
            'quiet neighborhood',
            'quiet neighbourhood',
            'peaceful',
            'peaceful area',
            'calm area',
            'quartier calme',
            'au calme',
            'zona calma',
            'zona tranquila',
          ],
        },
        {
          label: 'City center',
          keywords: [
            'city center',
            'city centre',
            'downtown',
            'centre ville',
            'centre-ville',
            'centro da cidade',
            'no centro da cidade',
            'centro',
          ],
        },
        {
          label: 'Sea view',
          keywords: [
            'sea view',
            'ocean view',
            'vue sur mer',
            'vue mer',
            'vista mar',
            'vista para o mar',
          ],
        },
        {
          label: 'River view',
          keywords: [
            'river view',
            'tagus view',
            'vue sur le fleuve',
            'vue sur la riviere',
            'vista rio',
            'vista para o rio',
          ],
        },
        {
          label: 'Swimming pool',
          keywords: [
            'swimming pool',
            'pool',
            'piscine',
            'piscina',
          ],
        },
        {
          label: 'Pet friendly',
          keywords: [
            'pet friendly',
            'pet-friendly',
            'pets allowed',
            'dog friendly',
            'animaux acceptes',
            'accepte les animaux',
            'animais permitidos',
            'permitidos animais',
            'sejam permitidos animais',
          ],
        },
        {
          label: 'Home office',
          keywords: [
            'home office',
            'office room',
            'workspace',
            'bureau a domicile',
            'bureau pour le teletravail',
            'teletravail',
            'escritorio em casa',
          ],
        },
        {
          label: 'Energy efficient',
          keywords: [
            'energy efficient',
            'energy-efficient',
            'energy class a',
            'solar panels',
            'efficacite energetique',
            'econome en energie',
            'eficiencia energetica',
            'eficiente em termos energeticos',
            'paineis solares',
          ],
        },
        {
          label: 'Near train',
          keywords: [
            'near train',
            'train station',
            'near railway',
            'proche de la gare',
            'pres de la gare',
            'perto da estacao de comboio',
            'perto da estacao de comboios',
          ],
        },
        {
          label: 'Near airport',
          keywords: [
            'near airport',
            'near the airport',
            'close to airport',
            'close to the airport',
            'proche de l aeroport',
            "proche de l'aeroport",
            'pres de l aeroport',
            "pres de l'aeroport",
            'perto do aeroporto',
          ],
        },
      ];

    const escapeRegex = (input: string): string =>
      input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const negation =
      /(?:^|\b)(?:no|without|not|sans|pas de|pas d'|aucun|aucune|sem|nao quero|nao queremos|nao preciso de|nao precisa de)\s+(?:(?:a|an|the|de|du|des|la|le|um|uma|o|os|as)\s+)?$/i;

    const mustHave: string[] = [];

    for (const feature of features) {
      let positive = false;
      let negative = false;

      for (const keyword of feature.keywords) {
        const pattern = new RegExp(
          String.raw`(?<![\p{L}\p{N}])${escapeRegex(keyword)}(?![\p{L}\p{N}])`,
          'giu',
        );

        for (const match of text.matchAll(pattern)) {
          const position = match.index ?? 0;

          const before = text.slice(
            Math.max(0, position - 80),
            position,
          );

          // Examine the clause preceding the amenity.
          const clause =
            before.split(
              /[,;.!?]|\b(?:but|mais|porem|however)\b/i,
            ).pop() ?? '';

          const normalizedClause = clause.trimEnd() + ' ';

          const portugueseLocationPrefix =
            /\bno\s+$/i.test(clause) &&
            /^(?:centro|centro da cidade)$/i.test(keyword);

          if (
            !portugueseLocationPrefix &&
            negation.test(normalizedClause)
          ) {
            negative = true;
          } else {
            positive = true;
          }
        }
      }

      // Explicitly excluded amenities are not required.
      if (positive && !negative) {
        mustHave.push(feature.label);
      }
    }

    return mustHave;
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
          : data.minBudget !== null
            ? ` with a minimum budget of ${formatEuro(data.minBudget)}`
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


    const propertyDescription = [
      bedroomText,
      data.propertyType,
    ].filter(Boolean).join(' ');

    const article = /^[aeiou]/i.test(propertyDescription)
      ? 'an'
      : 'a';

    const propertyText = propertyDescription
      ? `${article} ${propertyDescription}`
      : 'a property';

    return (
      `Buyer is looking for ${propertyText} ` +
      `in ${data.location}${budgetText}. ` +
      `The property is intended ${goalMap[data.goal] || 'to buy'}.` +
      bathroomText +
      areaText +
      featuresText
    );

  }


  private extractBathrooms(value: string): string {
    const text = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const bathroomUnit =
      String.raw`(?:bathrooms?|baths?|salles?\s+de\s+bains?|casas?\s+de\s+banho)`;

    // Numeric quantities: 2 bathrooms, 3 salles de bain
    const numeric = text.match(
      new RegExp(
        String.raw`\b(\d{1,2})\s*[- ]?\s*${bathroomUnit}\b`,
        'i',
      ),
    );

    if (numeric) {
      return numeric[1];
    }

    // Written quantities: two bathrooms, duas casas de banho
    const words: Record<string, string> = {
      one: '1',
      two: '2',
      three: '3',
      four: '4',
      five: '5',
      un: '1',
      une: '1',
      deux: '2',
      trois: '3',
      quatre: '4',
      cinq: '5',
      um: '1',
      uma: '1',
      dois: '2',
      duas: '2',
      tres: '3',
      quatro: '4',
      cinco: '5',
    };

    const written = text.match(
      new RegExp(
        String.raw`\b(one|two|three|four|five|un|une|deux|trois|quatre|cinq|um|uma|dois|duas|tres|quatro|cinco)\s+${bathroomUnit}\b`,
        'i',
      ),
    );

    return written ? words[written[1]] : '';
  }





  private extractArea(value: string): {
    minArea: number | null;
    maxArea: number | null;
  } {
    const text = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const unit =
      String.raw`(?:m²|m2|sqm|sq\.?\s*m|square\s+(?:meters?|metres?))`;

    const number = String.raw`(\d+(?:[.,]\d+)?)`;
    const end = String.raw`(?![\w²])`;

    const parseArea = (raw: string): number | null => {
      const amount = Number(raw.replace(',', '.'));

      return Number.isFinite(amount) && amount > 0
        ? amount
        : null;
    };

    // 1. Surface intervals in EN / FR / PT
    const between = new RegExp(
      String.raw`\b(?:between|entre)\s+${number}\s+(?:and|to|et|e|a)\s+${number}\s*${unit}${end}`,
      'i',
    );

    const range = new RegExp(
      String.raw`\b${number}\s*(?:-|–|—|to|a)\s*${number}\s*${unit}${end}`,
      'i',
    );

    const rangeMatch = text.match(between) ?? text.match(range);

    if (rangeMatch) {
      const minArea = parseArea(rangeMatch[1]);
      const maxArea = parseArea(rangeMatch[2]);

      if (
        minArea !== null &&
        maxArea !== null &&
        minArea <= maxArea
      ) {
        return { minArea, maxArea };
      }
    }

    // 2. Minimum before the number
    const minimum = new RegExp(
      String.raw`\b(?:at least|minimum(?:\s+(?:de|floor area of))?|min|over|above|more than|au moins|plus de|superieur a|a partir de|pelo menos|mais de|no minimo|acima de)\s+${number}\s*${unit}${end}`,
      'i',
    );

    // 3. Maximum before the number
    const maximum = new RegExp(
      String.raw`\b(?:no more than|not more than|under|below|up to|at most|maximum(?: de)?|max|less than|moins de|au maximum|au plus|jusqu'a|inferieur a|ate|menos de|no maximo|abaixo de)\s+${number}\s*${unit}${end}`,
      'i',
    );

    // 4. Minimum after the number
    // Example: 75 m² minimum
    const minimumAfter = new RegExp(
      String.raw`\b${number}\s*${unit}\s*(?:minimum|minimo|at least|min)\b`,
      'i',
    );

    // 5. Maximum after the number
    // Example: 45 m² maximum
    const maximumAfter = new RegExp(
      String.raw`\b${number}\s*${unit}\s*(?:maximum|maximo|at most|max)\b`,
      'i',
    );

    const minimumSearchText = text.replace(
      /\b(?:no more than|not more than)\b/gi,
      ' ',
    );

    const minMatch =
      minimumSearchText.match(minimum) ??
      text.match(minimumAfter);

    const maxMatch =
      text.match(maximum) ?? text.match(maximumAfter);

    const minArea = minMatch
      ? parseArea(minMatch[1])
      : null;

    const maxArea = maxMatch
      ? parseArea(maxMatch[1])
      : null;

    if (
      minArea !== null &&
      maxArea !== null &&
      minArea > maxArea
    ) {
      return {
        minArea: null,
        maxArea: null,
      };
    }

    return { minArea, maxArea };
  }




}