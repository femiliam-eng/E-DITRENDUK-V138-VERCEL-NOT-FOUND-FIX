#!/usr/bin/env python3
"""Lossless cell-value staging for the two supplied 2026 workbook files.
Uses standard OOXML reading when artifact_tool cannot import legacy workbook extensions.
No external network access or database writes.
"""
from pathlib import Path
import zipfile, xml.etree.ElementTree as ET, re, json, gzip, hashlib, datetime, collections, argparse
NS='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
RN='{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
PN='{http://schemas.openxmlformats.org/package/2006/relationships}'
BASE=Path(__file__).resolve().parents[1]

def colname(ref):
    return re.match(r'[A-Z]+',ref).group(0)

def reader(src):
    with zipfile.ZipFile(src) as z:
        root=ET.fromstring(z.read('xl/workbook.xml'))
        rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        paths={r.attrib['Id']:r.attrib['Target'] for r in rels}
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            sr=ET.fromstring(z.read('xl/sharedStrings.xml'))
            shared=[''.join(t.text or '' for t in si.iter(NS+'t')) for si in sr.iter(NS+'si')]
        for sheet in root.iter(NS+'sheet'):
            name=sheet.get('name'); rid=sheet.get(RN+'id'); target=paths[rid].lstrip('/')
            if not target.startswith('xl/'): target='xl/'+target
            if target not in z.namelist(): continue
            count=0
            with z.open(target) as f:
                context=ET.iterparse(f,events=('end',))
                for _, row in context:
                    if row.tag != NS+'row': continue
                    out={}
                    for cell in row.findall(NS+'c'):
                        ref=cell.get('r','');col=colname(ref) if ref and re.match(r'[A-Z]+',ref) else None
                        if col is None:continue
                        raw=cell.find(NS+'v'); inline=cell.find(NS+'is');typ=cell.get('t','')
                        if typ=='s' and raw is not None and raw.text is not None:
                            try: value=shared[int(raw.text)]
                            except (IndexError,ValueError):value=''
                        elif inline is not None: value=''.join(t.text or '' for t in inline.iter(NS+'t'))
                        elif raw is not None: value=raw.text
                        else:continue
                        if value is not None and str(value).strip()!='':out[col]=str(value)
                    if out:
                        count+=1
                        yield name,int(row.get('r')),out
                    row.clear()

def dateval(s):
    s=str(s or '').strip()
    if re.fullmatch(r'\d+(\.0)?',s):
        try:
            day=int(float(s))
            if 40000<=day<=60000:return (datetime.date(1899,12,30)+datetime.timedelta(days=day)).isoformat()
        except ValueError:pass
    if re.fullmatch(r'\d{4}-\d\d-\d\d',s):
        try:return datetime.date.fromisoformat(s).isoformat()
        except ValueError:pass
    return ''

def mapped(name,sheet,row,cols,sourcehash):
    if name=='Agenda Kegiatan Ditrenduk 2026  (1)(4).xlsx' and sheet=='Agenda Kegiatan' and row>=4 and cols.get('D','').strip() and cols.get('D','').strip().lower()!='kegiatan':
        out=dict(tanggal=dateval(cols.get('B')),asalSurat=cols.get('C',''),kegiatan=cols.get('D',''),tempat=cols.get('E',''),waktu=cols.get('F',''),disposisi=cols.get('G',''),nomorSurat=cols.get('H',''),hasilKegiatan='',sourceDateOriginal=cols.get('B',''))
        return 'agenda_kegiatan',out
    if name=='Agenda Kegiatan Ditrenduk 2026  (1)(4).xlsx' and sheet=='Task Deadline' and row>=4 and cols.get('E','').strip() and cols.get('E','').strip().lower()!='tugas':
        status=str(cols.get('H','')).strip().lower()
        if status not in ('done','not yet'): status='not yet'
        out=dict(nomorSurat=cols.get('C',''),asalSurat=cols.get('D',''),tugas=cols.get('E',''),kebutuhan=cols.get('F',''),deadline=dateval(cols.get('G')),status=status,disposisi=cols.get('I',''),sourceDateOriginal=cols.get('G',''),sourceStatusOriginal=cols.get('H',''))
        return 'task_deadline',out
    return None,None

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--agenda',required=True);ap.add_argument('--logbook',required=True);args=ap.parse_args()
    dest=BASE/'data-import';dest.mkdir(exist_ok=True)
    rawout=dest/'excel-v132-source.jsonl.gz';mappedout=dest/'excel-v132-modules.jsonl.gz'
    counts=collections.Counter();mappedcounts=collections.Counter();dupes=0
    with gzip.open(rawout,'wt',encoding='utf8',compresslevel=6) as orig, gzip.open(mappedout,'wt',encoding='utf8',compresslevel=6) as module:
        for source in (Path(args.agenda),Path(args.logbook)):
            digest=hashlib.sha256(source.read_bytes()).hexdigest();name=source.name
            for sheet,row,cells in reader(source):
                record={'source':name,'sha256':digest,'sheet':sheet,'row':row,'cells':cells}
                orig.write(json.dumps(record,ensure_ascii=False,separators=(',',':'))+'\n');counts[(name,sheet)]+=1
                kind,payload=mapped(name,sheet,row,cells,digest)
                if kind:
                    identity=hashlib.sha256(f'{digest}:{sheet}:{row}'.encode()).hexdigest()[:28]
                    payload['id']=('agd_' if kind=='agenda_kegiatan' else 'tsk_')+identity
                    payload['sourceWorkbook']=name;payload['sourceSheet']=sheet;payload['sourceRow']=row
                    module.write(json.dumps({'table':kind,'payload':payload},ensure_ascii=False,separators=(',',':'))+'\n');mappedcounts[kind]+=1
    summary={'preparedOnly':True,'databaseImported':False,'sources':[{'name':x,'sheet':y,'nonEmptyRows':n} for (x,y),n in counts.items()],'mappedModuleRows':dict(mappedcounts),'totalSourceRows':sum(counts.values()),'totalMappedRows':sum(mappedcounts.values())}
    (dest/'excel-v132-manifest.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'totalSourceRows':summary['totalSourceRows'],'mappedModuleRows':dict(mappedcounts),'sheets':len(counts),'rawBytes':rawout.stat().st_size,'mappedBytes':mappedout.stat().st_size},ensure_ascii=False))
if __name__=='__main__':main()
