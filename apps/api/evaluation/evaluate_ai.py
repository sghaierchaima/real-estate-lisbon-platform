#!/usr/bin/env python3
"""Mini-benchmark of NestJS property extraction (Python standard library only).
Run with AI_EXTRACTION_PROVIDER=ollama or regex in NestJS environment.
"""
import argparse
import csv
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

FIELDS = ['location', 'minBudget', 'maxBudget', 'propertyType', 'bedrooms', 'bathrooms', 'minArea', 'maxArea', 'goal', 'mustHave']
NUMERIC = {'minBudget', 'maxBudget', 'minArea', 'maxArea'}


def normalized(field, value):
    if field == 'mustHave':
        return sorted(set(x.strip().casefold() for x in value)) if isinstance(value, list) else value
    if field in NUMERIC:
        return value
    if isinstance(value, str):
        return value.strip().casefold()
    return value


def post(url, search_text, timeout):
    body = json.dumps({'searchText': search_text}, ensure_ascii=False).encode('utf-8')
    request = Request(url, data=body, headers={'Content-Type': 'application/json; charset=utf-8'}, method='POST')
    with urlopen(request, timeout=timeout) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://localhost:3001/ai/property-search/extract')
    parser.add_argument('--dataset', default=str(Path(__file__).with_name('evaluation_dataset.json')))
    parser.add_argument('--provider', choices=['ollama', 'regex'], required=True, help='Label; ensure NestJS AI_EXTRACTION_PROVIDER matches this value')
    parser.add_argument('--timeout', type=float, default=90)
    parser.add_argument('--output', default=str(Path(__file__).with_name('results')))
    args = parser.parse_args()
    cases = json.loads(Path(args.dataset).read_text(encoding='utf-8'))
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    records = []
    for index, case in enumerate(cases, 1):
        start = time.perf_counter()
        prediction = None
        error = None
        try:
            prediction = post(args.url, case['searchText'], args.timeout)
            if not isinstance(prediction, dict):
                raise ValueError('API response must be a JSON object')
        except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
            error = str(exc)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        matches = {field: (normalized(field, prediction.get(field)) == normalized(field, case['expected'][field])) if prediction is not None else False for field in FIELDS}
        records.append({'id': case['id'], 'language': case['language'], 'category': case['category'], 'searchText': case['searchText'], 'expected': case['expected'], 'prediction': prediction, 'error': error, 'latency_ms': elapsed_ms, 'matches': matches, 'all_fields_correct': all(matches.values())})
        print(f"[{index:02}/{len(cases):02}] {case['id']}: {sum(matches.values())}/{len(FIELDS)} fields, {elapsed_ms:.0f} ms" + (f' ERROR: {error}' if error else ''))
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    prefix = f'{args.provider}_{stamp}'
    json_path = output / f'{prefix}.json'
    csv_path = output / f'{prefix}.csv'
    json_path.write_text(json.dumps({'provider_label': args.provider, 'endpoint': args.url, 'run_at_utc': stamp, 'records': records}, ensure_ascii=False, indent=2), encoding='utf-8')
    with csv_path.open('w', newline='', encoding='utf-8-sig') as handle:
        writer = csv.DictWriter(handle, fieldnames=['id', 'language', 'category', 'latency_ms', 'error', 'all_fields_correct'] + [f'{field}_correct' for field in FIELDS])
        writer.writeheader()
        for record in records:
            writer.writerow({**{key: record[key] for key in ['id', 'language', 'category', 'latency_ms', 'error', 'all_fields_correct']}, **{f'{field}_correct': record['matches'][field] for field in FIELDS}})
    total = len(records)
    print('\nFIELD ACCURACY (exact match, including missing values)')
    for field in FIELDS:
        hits = sum(record['matches'][field] for record in records)
        print(f'  {field:15s} {hits:2d}/{total:2d} ({hits / total:.1%})')
    all_hits = sum(record['all_fields_correct'] for record in records)
    successes = sum(record['error'] is None for record in records)
    print(f'Entire extraction correct: {all_hits}/{total} ({all_hits / total:.1%})')
    print(f'API success/JSON object: {successes}/{total} ({successes / total:.1%})')
    print(f'Mean latency: {sum(r["latency_ms"] for r in records) / total:.0f} ms')
    print(f'Files: {json_path} and {csv_path}')
    print('NOTE: --provider is a run label, not a backend switch. Restart NestJS with matching AI_EXTRACTION_PROVIDER.')


if __name__ == '__main__':
    main()
