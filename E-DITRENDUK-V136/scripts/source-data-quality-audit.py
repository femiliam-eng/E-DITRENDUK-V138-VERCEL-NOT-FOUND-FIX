#!/usr/bin/env python3
"""Read-only structural checks for imported Agenda, Task, Monitoring, and RAKOM data."""
import argparse,sqlite3,json,collections,datetime,pathlib
p=argparse.ArgumentParser();p.add_argument('--sqlite',required=True);p.add_argument('--json-output');args=p.parse_args()
c=sqlite3.connect(pathlib.Path(args.sqlite).resolve().as_uri()+'?mode=ro',uri=True)
checks={'tables':{},'notes':['Non-ISO dates may be valid Indonesian text or date ranges; flagged for manual review, not automatically classified as invalid. Source records are not changed.','SQLite data quality does not establish parity with Excel or live PostgreSQL.']}
for table,datefield,required in [('agenda_kegiatan','tanggal','kegiatan'),('task_deadline','deadline','tugas'),('monitoring','tanggal','nama'),('disposisi',None,'perihal')]:
 records=[json.loads(x[0]) for x in c.execute(f'SELECT payload FROM "{table}"')]
 ids=[str(r.get('id','')).strip() for r in records]
 missing_date=non_iso_date=0
 for r in records:
  if not datefield:continue
  v=str(r.get(datefield,'')).strip()
  if not v:missing_date+=1
  else:
   try:datetime.date.fromisoformat(v[:10])
   except ValueError:non_iso_date+=1
 checks['tables'][table]={'rows':len(records),'duplicate_ids':sum(n-1 for n in collections.Counter(ids).values() if n>1),'empty_required_field':sum(not str(r.get(required,'')).strip() for r in records),'empty_date':missing_date,'non_iso_date_needs_review':non_iso_date}
c.close()
if args.json_output:pathlib.Path(args.json_output).write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(checks,ensure_ascii=False,indent=2))
