"""Copy authored workflows, generate MIT project templates, and hash the payload."""
from pathlib import Path
import json,shutil,hashlib,sys
if len(sys.argv)>1:
    sys.path.insert(0,sys.argv[1])
from docx import Document
from docx.shared import Pt
from openpyxl import Workbook
from openpyxl.styles import Font,PatternFill
from pptx import Presentation

ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'src/portable-skills'
TARGET=ROOT/'build/integrations/portable-skills'
TARGET.mkdir(parents=True,exist_ok=True)
shutil.copytree(SOURCE,TARGET,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
guides=TARGET/'pack/docs'
guides.mkdir(exist_ok=True)
for name in ('PORTABLE-SKILLS.md','EXTRA-MCPS.md','INTEGRATED-SETUP.md','TROUBLESHOOTING.md'):
    shutil.copy2(ROOT/'docs'/name,guides/name)
manifest=json.loads((TARGET/'pack/manifest.json').read_text())
sheet_headers={
 'analytics-dashboard':['Period','Visitors','Leads','Customers','Revenue','Conversion rate'],
 'financial-budget':['Category','Budget','Actual','Variance'],
 'operating-calendar':['Date','Activity','Owner','Status'],
 'project-tracker':['Task','Owner','Start','Due','Status','Priority'],
 'sales-pipeline':['Opportunity','Stage','Value','Probability','Weighted value','Owner'],
 'three-statement-forecast':['Period','Revenue','Expenses','Net income','Cash opening','Cash closing'],
}
doc_sections={
 'design-report':['Purpose','Design requirements','Proposed design','Validation','Open decisions'],
 'experiment-analysis':['Question','Method','Results','Interpretation','Limitations'],
 'investment-committee-memo':['Decision requested','Investment thesis','Financial case','Risks','Next steps'],
 'legal-memorandum':['Question presented','Relevant facts','Applicable authority','Analysis','Conclusion'],
 'minimal-letterhead':['Recipient','Subject','Message','Signature'],
 'strategy-memorandum':['Decision requested','Context','Options','Recommendation','Execution plan'],
 'system-design':['Requirements','Architecture','Interfaces and data','Failure modes','Validation'],
}
for entry in manifest['adaptations']:
    if not entry['source_name'].startswith('artifact-template-'):
        continue
    folder=TARGET/'pack/skills'/entry['target']
    config=json.loads((folder/'artifact-template.json').read_text())
    f=folder/config['reference'];f.parent.mkdir(parents=True,exist_ok=True)
    key=entry['source_name'].removeprefix('artifact-template-')
    title=key.replace('-',' ').title()
    if f.suffix=='.docx':
        d=Document();d.styles['Normal'].font.name='Arial';d.styles['Normal'].font.size=Pt(11)
        d.add_heading(title,0)
        for section in doc_sections[key]:
            d.add_heading(section,1);d.add_paragraph('Replace with verified project content.')
        d.save(f)
    elif f.suffix=='.xlsx':
        w=Workbook();s=w.active;s.title='Overview';headers=sheet_headers[key];s.append(headers)
        for cell in s[1]:cell.font=Font(bold=True,color='FFFFFF');cell.fill=PatternFill('solid',fgColor='183153')
        for n in range(2,7):s.append([None]*len(headers))
        for column in s.columns:s.column_dimensions[column[0].column_letter].width=22
        s.freeze_panes='A2';s.auto_filter.ref=f'A1:{s.cell(1,len(headers)).column_letter}6'
        if key=='financial-budget':
            for n in range(2,7):s.cell(n,4,f'=C{n}-B{n}')
        elif key=='sales-pipeline':
            for n in range(2,7):s.cell(n,5,f'=C{n}*D{n}');s.cell(n,4).number_format='0%'
        elif key=='analytics-dashboard':
            for n in range(2,7):s.cell(n,6,f'=IFERROR(D{n}/B{n},0)').number_format='0.0%'
        elif key=='three-statement-forecast':
            for n in range(2,7):s.cell(n,4,f'=B{n}-C{n}');s.cell(n,6,f'=E{n}+D{n}')
        w.save(f)
    else:
        p=Presentation()
        for index,heading in enumerate([title,'Context and evidence','Decisions and next steps']):
            slide=p.slides.add_slide(p.slide_layouts[0 if index==0 else 1]);slide.shapes.title.text=heading
            slide.placeholders[1].text='Replace with verified project content.'
        p.save(f)
    config.pop('preview',None)
    (folder/'artifact-template.json').write_text(json.dumps(config,indent=2))
    (folder/'assets/NOTICE.txt').write_text('Project-authored starter template. Copyright hongnam207 contributors. MIT license; see repository LICENSE. Not an OpenAI template replica.\n')
shutil.copy2(ROOT/'LICENSE',TARGET/'pack/LICENSE')
hashes={p.relative_to(TARGET/'pack').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((TARGET/'pack/skills').rglob('*')) if p.is_file() and '__pycache__' not in p.parts}
hashes['manifest.json']=hashlib.sha256((TARGET/'pack/manifest.json').read_bytes()).hexdigest()
(TARGET/'pack/payload-hashes.json').write_text(json.dumps(hashes,indent=2))
(TARGET/'pack/CONVERSION-MAP.md').write_text('# Conversion map\n\nSource | Target | Capability status\n--- | --- | ---\n'+'\n'.join(e['source_name']+' | '+e['target']+' | '+e['status'] for e in manifest['adaptations'])+'\n',encoding='utf-8')
print('Prepared 40 portable skills with 20 project-authored templates.')
