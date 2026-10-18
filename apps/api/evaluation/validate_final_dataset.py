#!/usr/bin/env python3
"""Validate a held-out property extraction dataset before running the benchmark."""
import argparse
import collections
import json
from pathlib import Path

FIELDS = {'location', 'minBudget', 'maxBudget', 'propertyType', 'bedrooms', 'bathrooms', 'minArea', 'maxArea', 'goal', 'mustHave'}
NUMERIC = ('minBudget', 'maxBudget', 'minArea', 'maxArea')
TYPES = {'', 'apartment', 'house', 'villa', 'studio', 'penthouse'}
GOALS = {'buy', 'invest', 'relocate', 'retire'}
AMENITIES = {'Parking', 'Balcony', 'Garden', 'Elevator', 'Near metro', 'Near beach', 'Near schools', 'Renovated', 'Quiet area', 'City center', 'Sea view', 'River view', 'Swimming pool', 'Pet friendly', 'Home office', 'Energy efficient', 'Near train', 'Near airport'}

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--dataset', default='evaluation_final_100.json')
    p.add_argument('--development', default='evaluation_dataset.json')
    args = p.parse_args()
    errors=[]
    cases=json.loads(Path(args.dataset).read_text(encoding='utf-8-sig'))
    if not isinstance(cases,list):
        raise SystemExit('Dataset must be a JSON array')
    if len(cases)!=100: errors.append(f'Expected 100 cases; got {len(cases)}')
    ids=[]; texts=[]; langs=[]
    for idx,case in enumerate(cases,1):
        label=f'case {idx}'
        if not isinstance(case,dict):
            errors.append(f'{label}: must be an object');continue
        if set(case)!={'id','language','category','searchText','expected'}:errors.append(f'{label}: unexpected/missing top-level fields')
        ident=case.get('id'); ids.append(ident)
        if not isinstance(ident,str) or not ident:errors.append(f'{label}: invalid id')
        lang=case.get('language');langs.append(lang)
        if lang not in ('en','fr','pt'):errors.append(f'{label}: invalid language')
        if not isinstance(case.get('category'),str) or not case['category']:errors.append(f'{label}: invalid category')
        txt=case.get('searchText')
        if not isinstance(txt,str) or not txt.strip():errors.append(f'{label}: invalid searchText')
        else:texts.append(txt.strip().casefold())
        exp=case.get('expected')
        if not isinstance(exp,dict):errors.append(f'{label}: expected must be object');continue
        if set(exp)!=FIELDS:errors.append(f'{label}: expected keys do not match 10 fields')
        for key in ('location','propertyType','bedrooms','bathrooms','goal'):
            if not isinstance(exp.get(key),str):errors.append(f'{label}: {key} must be string')
        if exp.get('propertyType') not in TYPES:errors.append(f'{label}: invalid propertyType')
        if exp.get('goal') not in GOALS:errors.append(f'{label}: invalid goal')
        for key in ('bedrooms','bathrooms'):
            v=exp.get(key)
            if isinstance(v,str) and v and (not v.isdecimal() or len(v)>2):errors.append(f'{label}: invalid {key}')
        for key in NUMERIC:
            v=exp.get(key)
            if v is not None and (isinstance(v,bool) or not isinstance(v,(int,float)) or v<=0):errors.append(f'{label}: invalid {key}')
        for lo,hi in [('minBudget','maxBudget'),('minArea','maxArea')]:
            if isinstance(exp.get(lo),(int,float)) and isinstance(exp.get(hi),(int,float)) and exp[lo]>exp[hi]:errors.append(f'{label}: {lo}>{hi}')
        feat=exp.get('mustHave')
        if not isinstance(feat,list) or any(not isinstance(v,str) or v not in AMENITIES for v in feat):errors.append(f'{label}: invalid mustHave')
        elif len(feat)!=len(set(feat)):errors.append(f'{label}: duplicate mustHave')
    if len(ids)!=len(set(ids)):errors.append('Duplicate IDs')
    if len(texts)!=len(set(texts)):errors.append('Duplicate search texts')
    count=collections.Counter(langs)
    if count!={'en':34,'fr':33,'pt':33}:errors.append(f'Unexpected language distribution: {dict(count)}')
    dev=Path(args.development)
    if dev.exists():
        dev_cases=json.loads(dev.read_text(encoding='utf-8-sig'))
        dev_texts={c['searchText'].strip().casefold() for c in dev_cases}
        overlaps=dev_texts.intersection(texts)
        if overlaps:errors.append(f'{len(overlaps)} exact text overlap(s) with development set')
    else:
        print(f'WARNING: development dataset not found at {dev}; overlap check skipped')
    print('Cases:',len(cases),'Languages:',dict(count),'Categories:',len(set(c.get('category') for c in cases if isinstance(c,dict))))
    if errors:
        for err in errors:print('ERROR:',err)
        raise SystemExit(1)
    print('PASS: structural checks completed. Human review of expected labels and semantic similarity is still required.')

if __name__=='__main__':main()
