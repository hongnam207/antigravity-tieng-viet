using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Automation;

class WindowsBridge {
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc callback, IntPtr l);
    delegate bool EnumProc(IntPtr h, IntPtr l);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h,StringBuilder b,int n);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h,out RECT r);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h,int n);
    [DllImport("user32.dll")] static extern bool SetCursorPos(int x,int y);
    [DllImport("user32.dll")] static extern void mouse_event(uint f,uint x,uint y,uint d,UIntPtr e);
    [DllImport("user32.dll")] static extern void keybd_event(byte v,byte s,uint f,UIntPtr e);
    [DllImport("user32.dll")] static extern uint SendInput(uint n, INPUT[] i,int size);
    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] static extern IntPtr WindowFromPoint(POINT p);
    [DllImport("user32.dll")] static extern IntPtr GetAncestor(IntPtr h,uint flags);
    [StructLayout(LayoutKind.Sequential)] struct RECT {public int Left,Top,Right,Bottom;}
    [StructLayout(LayoutKind.Sequential)] struct POINT {public int X,Y;}
    [StructLayout(LayoutKind.Sequential)] struct MOUSEINPUT {public int dx,dy;public uint mouseData,dwFlags,time;public UIntPtr extra;}
    [StructLayout(LayoutKind.Sequential)] struct KEYBDINPUT {public ushort vk,scan;public uint flags,time;public UIntPtr extra;}
    [StructLayout(LayoutKind.Explicit)] struct UNION {[FieldOffset(0)]public MOUSEINPUT mouse;[FieldOffset(0)]public KEYBDINPUT key;}
    [StructLayout(LayoutKind.Sequential)] struct INPUT {public uint type;public UNION data;}
    static JavaScriptSerializer json=new JavaScriptSerializer {MaxJsonLength=12000000};
    static Dictionary<string,object> req;
    static string S(string k,string fallback="") {object v;return req.TryGetValue(k,out v)?Convert.ToString(v):fallback;}
    static int I(string k,int fallback=0) {object v;return req.TryGetValue(k,out v)?Convert.ToInt32(v):fallback;}
    static IntPtr Target() {var h=new IntPtr(Convert.ToInt64(S("window")));if(!IsWindow(h)||!IsWindowVisible(h))throw new Exception("Cửa sổ không còn tồn tại hoặc đang ẩn. Hãy lấy danh sách mới.");return h;}
    static RECT Bounds(IntPtr h) {RECT r;if(!GetWindowRect(h,out r)||r.Right<=r.Left||r.Bottom<=r.Top)throw new Exception("Không đọc được kích thước cửa sổ.");return r;}
    static void Focus(IntPtr h) {if(GetForegroundWindow()==h)return;ShowWindow(h,9);SetForegroundWindow(h);Thread.Sleep(150);if(GetForegroundWindow()!=h)throw new Exception("Không thể đưa cửa sổ lên trước; chưa gửi thao tác.");}
    static object Windows() {var result=new List<object>();EnumWindows((h,l)=>{if(!IsWindowVisible(h))return true;var b=new StringBuilder(1024);GetWindowText(h,b,b.Capacity);if(b.Length==0)return true;uint pid;GetWindowThreadProcessId(h,out pid);string process="";try{process=Process.GetProcessById((int)pid).ProcessName;}catch{}result.Add(new{window=h.ToInt64().ToString(),title=b.ToString(),pid,process});return result.Count<200;},IntPtr.Zero);return new{windows=result};}
    static object State(IntPtr h) {
        var r=Bounds(h);var elements=new List<object>();
        try {var root=AutomationElement.FromHandle(h);var queue=new Queue<AutomationElement>();queue.Enqueue(root);int visited=0;
            while(queue.Count>0&&visited++<350){var e=queue.Dequeue();try{var c=e.Current;if(!c.IsOffscreen){var b=c.BoundingRectangle;elements.Add(new{name=c.IsPassword?"[password]":c.Name,type=c.ControlType.ProgrammaticName,enabled=c.IsEnabled,x=(int)b.Left-r.Left,y=(int)b.Top-r.Top,width=(int)b.Width,height=(int)b.Height});}var child=TreeWalker.ControlViewWalker.GetFirstChild(e);int siblings=0;while(child!=null&&queue.Count<350&&siblings++<150){queue.Enqueue(child);child=TreeWalker.ControlViewWalker.GetNextSibling(child);}}catch{}}
        }catch{}
        string image=null;int sw=0,sh=0;
        if(S("screenshot","true").ToLowerInvariant()!="false") {Focus(h);r=Bounds(h);int w=r.Right-r.Left,hh=r.Bottom-r.Top;if(w>12000||hh>12000)throw new Exception("Cửa sổ quá lớn để chụp.");using(var bitmap=new Bitmap(w,hh)){using(var g=Graphics.FromImage(bitmap))g.CopyFromScreen(r.Left,r.Top,0,0,bitmap.Size);double scale=Math.Min(1.0,1600.0/Math.Max(w,hh));sw=(int)(w*scale);sh=(int)(hh*scale);using(var small=new Bitmap(bitmap,new Size(sw,sh)))using(var ms=new MemoryStream()){small.Save(ms,ImageFormat.Png);image=Convert.ToBase64String(ms.ToArray());}}}
        return new{window=h.ToInt64().ToString(),width=r.Right-r.Left,height=r.Bottom-r.Top,elements,screenshot=image,screenshotWidth=sw,screenshotHeight=sh,coordinates="x/y are physical pixels relative to window, not scaled screenshot pixels"};
    }
    static void Move(IntPtr h) {var r=Bounds(h);int x=I("x"),y=I("y");if(x<0||y<0||x>=r.Right-r.Left||y>=r.Bottom-r.Top)throw new Exception("Tọa độ ngoài cửa sổ.");var point=new POINT{X=r.Left+x,Y=r.Top+y};if(GetAncestor(WindowFromPoint(point),2)!=h)throw new Exception("Điểm bị cửa sổ khác che; hãy chụp lại.");SetCursorPos(point.X,point.Y);}
    static byte Key(string key) {switch(key.ToUpperInvariant()){case "CTRL":case "CONTROL":return 17;case "SHIFT":return 16;case "ALT":return 18;case "ENTER":return 13;case "TAB":return 9;case "ESC":case "ESCAPE":return 27;case "SPACE":return 32;case "BACKSPACE":return 8;case "DELETE":return 46;case "UP":return 38;case "DOWN":return 40;case "LEFT":return 37;case "RIGHT":return 39;case "HOME":return 36;case "END":return 35;case "PAGEUP":return 33;case "PAGEDOWN":return 34;}if(key.Length==1&&char.IsLetterOrDigit(key[0]))return (byte)char.ToUpperInvariant(key[0]);int f;if(key.StartsWith("F",StringComparison.OrdinalIgnoreCase)&&int.TryParse(key.Substring(1),out f)&&f>=1&&f<=12)return(byte)(111+f);throw new Exception("Phím chưa hỗ trợ: "+key);}
    static object Run() {
        string action=S("action");if(action=="list")return Windows();
        if(action=="launch"){string exe=S("executable");if(!Path.IsPathRooted(exe)||!File.Exists(exe)||!exe.EndsWith(".exe",StringComparison.OrdinalIgnoreCase))throw new Exception("Cần đường dẫn tuyệt đối tới tệp .exe có sẵn.");Process.Start(new ProcessStartInfo(exe,S("arguments")){UseShellExecute=true});return new{ok=true};}
        var h=Target();if(action=="state")return State(h);Focus(h);
        if(action=="click"){Move(h);bool right=S("button")=="right";int count=I("count",1);if(count<1||count>2)throw new Exception("Số lần bấm không hợp lệ.");for(int n=0;n<count;n++){mouse_event(right?8u:2u,0,0,0,UIntPtr.Zero);mouse_event(right?16u:4u,0,0,0,UIntPtr.Zero);}}
        else if(action=="scroll"){Move(h);int delta=I("delta");if(Math.Abs((long)delta)>2400)throw new Exception("Cuộn tối đa 2400 mỗi lần.");mouse_event(0x800,0,0,unchecked((uint)delta),UIntPtr.Zero);}
        else if(action=="key"){var parts=S("key").Split('+');if(parts.Length>4)throw new Exception("Tổ hợp quá dài.");var keys=new List<byte>();foreach(var part in parts)keys.Add(Key(part.Trim()));try{foreach(var k in keys){keybd_event(k,0,0,UIntPtr.Zero);Thread.Sleep(15);}Thread.Sleep(50);}finally{keys.Reverse();foreach(var k in keys){keybd_event(k,0,2,UIntPtr.Zero);Thread.Sleep(15);}}}
        else if(action=="type"){string text=S("text");if(text.Length>4000)throw new Exception("Tối đa 4000 ký tự.");foreach(char c in text){var input=new[]{new INPUT{type=1,data=new UNION{key=new KEYBDINPUT{scan=c,flags=4}}},new INPUT{type=1,data=new UNION{key=new KEYBDINPUT{scan=c,flags=6}}}};if(SendInput(2,input,Marshal.SizeOf(typeof(INPUT)))!=2)throw new Exception("Windows từ chối nhập; kiểm tra quyền ứng dụng.");}}
        else throw new Exception("Thao tác không hợp lệ.");return new{ok=true,window=h.ToInt64().ToString()};
    }
    [STAThread]static int Main(){Console.InputEncoding=Encoding.UTF8;Console.OutputEncoding=new UTF8Encoding(false);try{SetProcessDPIAware();string line=Console.ReadLine();if(line==null||line.Length>30000)throw new Exception("Yêu cầu không hợp lệ.");req=json.Deserialize<Dictionary<string,object>>(line);Console.WriteLine(json.Serialize(Run()));return 0;}catch(Exception e){Console.WriteLine(json.Serialize(new{error=e.Message}));return 1;}}
}
