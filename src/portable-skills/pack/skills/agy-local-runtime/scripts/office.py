"""Local Office/PDF helper. No cloud, macros, arbitrary code evaluation or uploads."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile


def emit(value):
    print(json.dumps(value, ensure_ascii=True, indent=2, default=str))


def soffice_path(explicit=None):
    if explicit:
        p = Path(explicit)
        if not p.is_file():
            raise ValueError('Explicit LibreOffice executable does not exist')
        return str(p.resolve())
    candidates = [shutil.which('soffice'), shutil.which('libreoffice')]
    for key in ('ProgramFiles', 'ProgramFiles(x86)'):
        if os.environ.get(key):
            candidates.append(str(Path(os.environ[key])/'LibreOffice/program/soffice.exe'))
    return next((x for x in candidates if x and Path(x).is_file()), None)


def doctor():
    modules = ['docx', 'openpyxl', 'pptx', 'pymupdf', 'pypdf', 'reportlab', 'PIL', 'matplotlib']
    return {'imports': {m: importlib.util.find_spec(m) is not None for m in modules},
            'soffice': soffice_path(),
            'note': 'No Office rendering, formula calculation or MCP calls have been tested by doctor.'}


def inspect(path):
    path = Path(path).resolve(strict=True)
    result = {'file': str(path), 'bytes': path.stat().st_size}
    ext = path.suffix.lower()
    if ext == '.docx':
        from docx import Document
        d = Document(path)
        result.update(paragraphs=[p.text for p in d.paragraphs],
                      tables=[[[c.text for c in r.cells] for r in t.rows] for t in d.tables],
                      sections=len(d.sections))
    elif ext in ('.xlsx', '.xlsm'):
        from openpyxl import load_workbook
        wb = load_workbook(path, read_only=True, data_only=False, keep_links=False)
        try:
            result['sheets'] = [{'name': s.title, 'rows': s.max_row, 'columns': s.max_column,
                                 'sample_rows': list(s.iter_rows(max_row=min(s.max_row,20), max_col=min(s.max_column,20), values_only=True))} for s in wb]
        finally:
            wb.close()
        result['formula_evaluation'] = 'not performed; samples contain formulas, not calculated values'
    elif ext == '.pptx':
        from pptx import Presentation
        d = Presentation(path)
        result.update(slide_count=len(d.slides), slide_size_emu=[d.slide_width,d.slide_height],
                      slides=[{'number': i+1, 'text': [s.text for s in slide.shapes if s.has_text_frame]} for i,slide in enumerate(d.slides)])
    elif ext == '.pdf':
        import pymupdf
        with pymupdf.open(path) as d:
            if d.needs_pass:
                raise ValueError('Encrypted PDF requires a separately authorized password workflow')
            result.update(page_count=len(d), pages=[{'number': i+1, 'text': page.get_text()} for i,page in enumerate(d)])
    else:
        raise ValueError('Supported inspect formats: docx, xlsx, xlsm, pptx, pdf')
    if ext in ('.xlsx','.xlsm','.docx','.pptx'):
        with zipfile.ZipFile(path) as z:
            risky = [n for n in z.namelist() if any(token in n.lower() for token in ('vba','externallink','activex','embedding','diagram','drawing'))]
        result['parts_needing_fidelity_review'] = risky
    return result


def empty_output(path):
    out = Path(path).resolve()
    if out.exists() and (not out.is_dir() or any(out.iterdir())):
        raise ValueError('Output directory must be new or empty; existing files are preserved')
    out.mkdir(parents=True, exist_ok=True)
    return out


def render(path, output, pages=None, executable=None):
    source = Path(path).resolve(strict=True)
    if source.suffix.lower() not in ('.docx','.xlsx','.pptx','.pdf'):
        raise ValueError('Unsupported render format')
    out = empty_output(output)
    pdf = source
    if source.suffix.lower() != '.pdf':
        executable = soffice_path(executable)
        if not executable:
            raise ValueError('LibreOffice not found. No Office preview was generated. Use --soffice or a connected native Office tool.')
        with tempfile.TemporaryDirectory(prefix='agy-office-profile-') as profile:
            completed = subprocess.run([executable, '-env:UserInstallation='+Path(profile).as_uri(),
                                        '--headless','--convert-to','pdf','--outdir',str(out),str(source)],
                                       capture_output=True, text=True, timeout=180)
        pdf = out/(source.stem+'.pdf')
        if completed.returncode or not pdf.is_file():
            raise RuntimeError('LibreOffice conversion failed: '+completed.stdout[-1500:]+completed.stderr[-1500:])
    import pymupdf
    with pymupdf.open(pdf) as document:
        if document.needs_pass:
            raise ValueError('Encrypted PDF cannot be rendered without authorization/password')
        selected = set(range(min(8,len(document))))
        if pages:
            selected = set()
            for item in pages.split(','):
                bounds = item.split('-')
                first = int(bounds[0]); last = int(bounds[-1])
                if first < 1 or last < first or last > len(document):
                    raise ValueError('Page selection outside PDF bounds')
                selected.update(range(first-1,last))
        files = []
        for index in sorted(selected):
            destination = out/f'page-{index+1:04}.png'
            document[index].get_pixmap(matrix=pymupdf.Matrix(1.5,1.5), alpha=False).save(destination)
            files.append(str(destination))
        return {'source':str(source), 'pdf':str(pdf),'page_count':len(document),'rendered_pages':[x+1 for x in sorted(selected)],'images':files,
                'note':'Inspect generated images to complete visual QA; rendering does not by itself verify layout.'}


def clone(source, destination):
    source = Path(source).resolve(strict=True)
    destination = Path(destination).absolute()
    if source.suffix.lower() != destination.suffix.lower():
        raise ValueError('Template clone must retain its file extension')
    destination.parent.mkdir(parents=True,exist_ok=True)
    # Exclusive creation prevents accidental overwrite, including through symlinks.
    with source.open('rb') as reader, destination.open('xb') as writer:
        shutil.copyfileobj(reader,writer)
    return {'source':str(source),'output':str(destination),'byte_identical':True}


def self_test(output):
    out = empty_output(output)
    from docx import Document
    from openpyxl import Workbook, load_workbook
    from pptx import Presentation
    from reportlab.pdfgen import canvas
    d = Document(); d.add_heading('Portable runtime test',0); d.add_paragraph('Local DOCX'); d.save(out/'sample.docx')
    w = Workbook(); w.active.append(['Value','Formula']); w.active.append([2,'=A2*3']); w.save(out/'sample.xlsx')
    p = Presentation(); slide = p.slides.add_slide(p.slide_layouts[0]); slide.shapes.title.text='Local PPTX'; p.save(out/'sample.pptx')
    c = canvas.Canvas(str(out/'sample.pdf')); c.drawString(72,720,'Local PDF'); c.save()
    for extension in ('docx','xlsx','pptx','pdf'):
        inspect(out/('sample.'+extension))
    wb=load_workbook(out/'sample.xlsx'); assert wb.active['B2'].value=='=A2*3'; wb.close()
    rendered=render(out/'sample.pdf',out/'pdf-preview')
    assert len(rendered['images'])==1 and Path(rendered['images'][0]).stat().st_size>0
    return {'passed':['DOCX create/reopen','XLSX formula preservation','PPTX create/reopen','PDF text extraction/raster render'],
            'not_tested':['Office rendering','Excel recalculation','template layout fidelity','live MCP tools'], 'output':str(out)}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest='command',required=True)
    sub.add_parser('doctor')
    p=sub.add_parser('inspect'); p.add_argument('file')
    p=sub.add_parser('render'); p.add_argument('file'); p.add_argument('--out',required=True); p.add_argument('--pages'); p.add_argument('--soffice')
    p=sub.add_parser('clone-template'); p.add_argument('source'); p.add_argument('destination')
    p=sub.add_parser('self-test'); p.add_argument('--out',required=True)
    args=parser.parse_args()
    if args.command=='doctor': emit(doctor())
    elif args.command=='inspect': emit(inspect(args.file))
    elif args.command=='render': emit(render(args.file,args.out,args.pages,args.soffice))
    elif args.command=='clone-template': emit(clone(args.source,args.destination))
    elif args.command=='self-test': emit(self_test(args.out))


if __name__=='__main__':
    try:
        main()
    except Exception as error:
        import sys
        print(type(error).__name__+': '+str(error),file=sys.stderr)
        sys.exit(1)
