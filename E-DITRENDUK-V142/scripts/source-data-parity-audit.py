#!/usr/bin/env python3
"""Read-only audit of bundled frontend seed data against an existing SQLite snapshot.
Does not modify SQLite, source data, or PostgreSQL. Requires no third-party packages.
"""
import argparse, json, sqlite3, pathlib, collections, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
MAP = {'monitoring':'monitoring','disposisi':'disposisi','logbook':'logbook','archive':'archive','users':'users_data','petugas':'petugas'}
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sqlite',required=True,help='Path to existing SQLite database (read-only)')
    parser.add_argument('--json-output',help='Optional output path for aggregate report')
    args=parser.parse_args()
    raw=(ROOT/'js/data.js').read_text(encoding='utf-8').strip()
    if not raw.startswith('window.EXCEL_DATA='):
        raise ValueError('Unexpected js/data.js structure')
    seed=json.loads(raw.partition('=')[2].rstrip('; \r\n'))
    con=sqlite3.connect(pathlib.Path(args.sqlite).resolve().as_uri()+'?mode=ro',uri=True)
    report={'source':'bundled js/data.js versus SQLite snapshot (read-only)','modules':{},'separate_sqlite_modules':{},'all_seed_ids_present':True}
    for key,table in MAP.items():
        local=seed.get(key,[])
        dbrows=[(str(id_),json.loads(payload)) for id_,payload in con.execute('SELECT id,payload FROM "'+table+'"')]
        # Some source records (petugas) have no ID: compare canonical row content as multisets.
        canon=lambda item:json.dumps(item,ensure_ascii=False,sort_keys=True,separators=(',',':'))
        left=collections.Counter(map(canon,local));right=collections.Counter(canon(p) for _,p in dbrows)
        local_ids={str(row['id']) for row in local if isinstance(row,dict) and row.get('id') is not None}
        db_ids={id_ for id_,_ in dbrows}
        missing=sorted(local_ids-db_ids)
        added=sorted(db_ids-local_ids)
        report['modules'][key]={'seed_rows':len(local),'sqlite_rows':len(dbrows),'identical_payload_rows':sum((left&right).values()),'seed_only_rows':sum((left-right).values()),'sqlite_only_rows':sum((right-left).values()),'missing_seed_ids_in_sqlite':missing[:10],'sqlite_ids_not_in_seed':added[:10]}
        if missing:report['all_seed_ids_present']=False
    for table in ('agenda_kegiatan','task_deadline','schedules'):
        report['separate_sqlite_modules'][table]=con.execute('SELECT COUNT(*) FROM "'+table+'"').fetchone()[0]
    con.close()
    report['note']='Equal counts or payloads do not verify that Excel originals were fully imported; live PostgreSQL is not checked.'
    if args.json_output:pathlib.Path(args.json_output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return 0 if report['all_seed_ids_present'] else 2
if __name__=='__main__':sys.exit(main())
