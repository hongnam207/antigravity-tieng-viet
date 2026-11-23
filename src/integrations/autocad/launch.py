"""Run the pinned CAD server with private dependencies, using bundled Python."""
import os
import pathlib
import site
import sys

root = pathlib.Path(__file__).resolve().parent
packages = root / 'site'
sys.path.insert(0, str(packages))
site.addsitedir(str(packages))
# pywin32 wheels need their own DLL directory in an embedded Python runtime.
_dll_handles = []
if os.name == 'nt':
    for relative in ('pywin32_system32', 'win32', 'win32/lib'):
        folder = packages / relative
        if folder.is_dir():
            sys.path.insert(1, str(folder))
            _dll_handles.append(os.add_dll_directory(str(folder)))

if '--verify' in sys.argv:
    import importlib.metadata
    import server
    import ezdxf
    import matplotlib
    import openpyxl
    if os.name == 'nt':
        import pythoncom
        import win32com.client
    print('AutoCAD MCP ' + importlib.metadata.version('autocad-mcp-pro') + ' runtime verified')
else:
    # All relative file operations and caches belong to the user, not the bundle.
    os.environ.setdefault('AUTOCAD_MCP_BACKEND', 'auto')
    if os.environ['AUTOCAD_MCP_BACKEND'].lower().strip() == 'auto':
        # Upstream's COM backend initializes lazily: pywin32 alone makes auto
        # select COM even on a PC without AutoCAD. Check its registration first.
        engine = 'ezdxf'
        if os.name == 'nt':
            import winreg
            try:
                progid = os.environ.get('CAD_PROGID', 'AutoCAD.Application')
                with winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, progid + r'\CLSID'):
                    engine = 'com'
            except OSError:
                pass
        os.environ['AUTOCAD_MCP_BACKEND'] = engine
    from server import main
    main()
