"""Offline English to Vietnamese UI translation worker. JSON lines over inherited pipes only."""
import json, os, pathlib, re, sys, time

ROOT = pathlib.Path(__file__).resolve().parent
MODEL_ID = 'Helsinki-NLP/opus-mt-en-vi@989c9fb9/ct2-int8-ui-v4'
DICTIONARY=json.loads((ROOT/'vi.json').read_text(encoding='utf8'))
TRANSLATED_VALUES=frozenset(DICTIONARY.values())
MAX_CACHE = 10000

def eligible(text):
    if not isinstance(text, str) or not 2 <= len(text) <= 600: return False
    if len(re.findall(r'[A-Za-z]+',text))<2:return False
    if text in TRANSLATED_VALUES or re.match(r'^(Gemini|Claude|GPT)(?:\b|[- ])',text,re.I):return False
    if re.search(r'[^\x00-\x7f\u2010-\u2026\u00a0\u00b7]', text): return False
    if re.search(r'https?://|www\.|[\w.+-]+@[\w.-]+|[A-Z]:[\\/]|[/\\][\w.-]+[/\\]|[{}<>]|\b\S+\.(?:exe|dll|json|js|ts|py|txt|docx|xlsx|pdf|png|md)\b', text, re.I): return False
    if re.fullmatch(r'[\w.-]+',text) and ('_' in text or re.search(r'[a-z][A-Z]',text)): return False
    if text.strip() in {'Antigravity','Google','Gemini','Claude','GPT','GitHub','MCP','WSL','Turbo','Node.js','Google Sans'}: return False
    return True

class Engine:
    def __init__(self, cache_dir=None):
        self.model = None
        self.dictionary = DICTIONARY
        self.cache_dir = pathlib.Path(cache_dir) if cache_dir else ROOT/'cache'
        self.cache_dir.mkdir(exist_ok=True,parents=True)
        self.cache_file = self.cache_dir/'translations.json'
        self.cache = {}
        try:
            if self.cache_file.stat().st_size <= 8_000_000:
                data=json.loads(self.cache_file.read_text(encoding='utf8'))
                if data.get('model')==MODEL_ID:
                    self.cache={k:v for k,v in data.get('translations',{}).items() if eligible(k) and isinstance(v,str) and len(v)<=1800}
        except (OSError,ValueError,TypeError): pass

    def load_model(self):
        if self.model is not None:return
        import ctranslate2, sentencepiece
        self.model = ctranslate2.Translator(str(ROOT/'model'), device='cpu', compute_type='int8', inter_threads=1, intra_threads=2)
        # SentencePiece's Windows filename API uses the ANSI code page; Python's Unicode I/O does not.
        self.source = sentencepiece.SentencePieceProcessor(model_proto=(ROOT/'model/source.spm').read_bytes())
        self.target = sentencepiece.SentencePieceProcessor(model_proto=(ROOT/'model/target.spm').read_bytes())

    def save(self):
        if len(self.cache)>MAX_CACHE:self.cache=dict(list(self.cache.items())[-MAX_CACHE:])
        temporary=self.cache_file.with_suffix('.tmp')
        temporary.write_text(json.dumps({'model':MODEL_ID,'translations':self.cache},ensure_ascii=False),encoding='utf8')
        os.replace(temporary,self.cache_file)

    def translate(self,texts):
        if not isinstance(texts,list) or len(texts)>24:raise ValueError('Invalid batch size')
        answers=[None]*len(texts); missing=[]; positions={}; cache_hits=0
        for index,text in enumerate(texts):
            if not isinstance(text,str):continue
            text=' '.join(text.split())
            if text in self.dictionary:answers[index]=self.dictionary[text];cache_hits+=1
            elif text in self.cache:answers[index]=self.cache[text];cache_hits+=1
            elif eligible(text):
                if text not in positions:positions[text]=[];missing.append(text)
                positions[text].append(index)
        if missing:
            self.load_model()
            tokens=[['>>vie<<']+self.source.encode(text,out_type=str)+['</s>'] for text in missing]
            results=self.model.translate_batch(tokens,beam_size=2,max_decoding_length=192,repetition_penalty=1.1,disable_unk=True)
            for text,result in zip(missing,results):
                translated=self.target.decode([token for token in result.hypotheses[0] if token not in ['</s>','<s>','<pad>','>>vie<<']]).strip()
                # Domain-specific meanings of common UI terms, without changing model inputs.
                if re.search(r'\boffline\b',text,re.I):translated=translated.replace('không hoạt động','ngoại tuyến').replace('không trực tuyến','ngoại tuyến')
                if re.search(r'\bpreferences\b',text,re.I):translated=translated.replace('những ưu tiên','các tùy chọn').replace('sự ưu tiên','tùy chọn')
                if translated and len(translated)<=max(100,6*len(text)):
                    self.cache[text]=translated
                    for index in positions[text]:answers[index]=translated
            try:self.save()
            except OSError:pass # Translation still works when cache storage is unavailable.
        return {'translations':answers,'model_calls':len(missing),'cache_hits':cache_hits}

def main():
    sys.stdin.reconfigure(encoding='utf-8');sys.stdout.reconfigure(encoding='utf-8')
    if '--self-test' in sys.argv:
        import tempfile
        with tempfile.TemporaryDirectory(prefix='agvi-model-check-') as cache:
            result=Engine(cache).translate(['Choose a folder for your project.'])
            if not result['translations'][0] or 'thư mục' not in result['translations'][0]:raise RuntimeError('Offline model self-test failed')
        print('Offline translation self-test passed',flush=True)
        return
    engine=Engine()
    for line in sys.stdin:
        if len(line)>40000:continue
        identifier=None
        try:
            request=json.loads(line);identifier=request.get('id')
            start=time.perf_counter();result=engine.translate(request.get('texts'))
            result.update(id=identifier,ms=round(1000*(time.perf_counter()-start),1))
        except Exception as error:
            result={'id':identifier,'error':type(error).__name__}
        print(json.dumps(result,ensure_ascii=False),flush=True)

if __name__=='__main__':main()
