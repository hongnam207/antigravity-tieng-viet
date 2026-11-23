import importlib.util,json,pathlib,sys,tempfile,time,ctypes
root=pathlib.Path(__file__).resolve().parents[1]/'build'/'payload'
spec=importlib.util.spec_from_file_location('translator',root/'translator.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
def audit(event,args):
    if event in {'socket.connect','socket.bind','socket.getaddrinfo'}:raise AssertionError('Offline worker attempted networking: '+event)
sys.addaudithook(audit)
with tempfile.TemporaryDirectory(prefix='agvi-test-') as cache:
    start=time.perf_counter();engine=module.Engine(cache);loaded=time.perf_counter()-start
    assert engine.model is None,'Premature model load'
    texts=['Choose a folder for your project.','Automatically reopen your last workspace.','You can change these preferences at any time.','Keep previous conversations available offline.']
    start=time.perf_counter();first=engine.translate(texts);seconds=time.perf_counter()-start
    assert first['model_calls']==len(texts),first
    assert all(isinstance(s,str) and any(ord(c)>127 for c in s) for s in first['translations']),first
    assert 'tùy chọn' in first['translations'][2]
    assert 'ngoại tuyến' in first['translations'][3]
    second=engine.translate(texts);assert second['model_calls']==0 and second['cache_hits']==len(texts)
    new_engine=module.Engine(cache);third=new_engine.translate(texts);assert third['model_calls']==0,'Persistent cache failed'
    assert new_engine.model is None,'Cache hit loaded model'
    invalid=['https://example.com/private','person@example.com','C:\\Users\\Secret\\file.txt','myPrivateVariable','MY_SECRET_KEY','Giữ nguyên tiếng Việt','report.docx','Gemini 3.8 Flash','Claude Sonnet 4.6 (Thinking)','Cao']
    assert engine.translate(invalid)['translations']==[None]*len(invalid)
    assert engine.translate(['Settings'])['translations']==['Cài đặt']
    try:engine.translate(['x']*25);raise AssertionError('Batch cap not enforced')
    except ValueError:pass
    report={'model_load_seconds':round(loaded,3),'first_batch_seconds':round(seconds,3),'samples':dict(zip(texts,first['translations'])),'cache_verified':True,'network_attempts':0}
    class Counters(ctypes.Structure):
        _fields_=[('cb',ctypes.c_ulong),('PageFaultCount',ctypes.c_ulong)]+[(name,ctypes.c_size_t) for name in ['PeakWorkingSetSize','WorkingSetSize','QuotaPeakPagedPoolUsage','QuotaPagedPoolUsage','QuotaPeakNonPagedPoolUsage','QuotaNonPagedPoolUsage','PagefileUsage','PeakPagefileUsage']]
    counters=Counters();counters.cb=ctypes.sizeof(counters)
    ctypes.windll.kernel32.GetCurrentProcess.restype=ctypes.c_void_p
    ctypes.windll.psapi.GetProcessMemoryInfo.argtypes=[ctypes.c_void_p,ctypes.POINTER(Counters),ctypes.c_ulong]
    assert ctypes.windll.psapi.GetProcessMemoryInfo(ctypes.windll.kernel32.GetCurrentProcess(),ctypes.byref(counters),counters.cb)
    report['peak_working_set_mib_test_process']=round(counters.PeakWorkingSetSize/1024**2,1)
    pathlib.Path(__file__).with_name('worker-test-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps(report,ensure_ascii=False))
print('PASS offline inference, dictionary, text eligibility, batch bounds, memory cache and persistent cache')
