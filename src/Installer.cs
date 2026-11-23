using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Linq;
using System.Drawing;
using System.Diagnostics;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;

internal static class Program {
    static readonly string Title = "Antigravity tiếng Việt";
    static readonly string UserInstall = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "AntigravityVietnamese");
    static string Here { get { return Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location); } }
    static string Self { get { return Assembly.GetExecutingAssembly().Location; } }
    static readonly string[] PayloadFiles = { "node.exe", "NODE-LICENSE.txt", "patcher.cjs", "renderer.js", "native.js", "vi.json", "translator.py", "HUONG-DAN.txt", "BUILD.txt", "MODEL-NOTICE.txt", "install-plugin.cjs" };
    static string Q(string value) { return "\"" + value.Replace("\"", "\\\"") + "\""; }

    [STAThread] static int Main(string[] args) {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        try {
            if (args.Length == 2 && args[0] == "--render-preview") {
                using (var form = new SetupForm()) {
                    form.ShowInTaskbar = false;
                    form.StartPosition = FormStartPosition.Manual;
                    form.Location = new Point(-20000,-20000);
                    form.Show(); Application.DoEvents();
                    using (var bitmap = new Bitmap(form.Width,form.Height)) {
                        form.DrawToBitmap(bitmap,new Rectangle(0,0,form.Width,form.Height));
                        bitmap.Save(args[1],System.Drawing.Imaging.ImageFormat.Png);
                    }
                    form.Close();
                }
                return 0;
            }
            if (args.Length > 0 && args[0] == "--verify") {
                VerifyPayload(args.Length > 1 ? args[1] : Path.Combine(Path.GetTempPath(), "agvi-verify-" + Guid.NewGuid().ToString("N")));
                return 0;
            }
            // A deterministic isolated installation test; never writes real shortcuts or launches the app.
            if (args.Length == 3 && args[0] == "--test-install") {
                InstallCore(args[1], args[2], false); return 0;
            }
            if (args.Length == 2 && args[0] == "--install") {
                InstallCore(args[1], UserInstall, true); return 0;
            }
            if (args.Length > 0 && (args[0] == "--launch" || args[0] == "--restore" || args[0] == "--status")) {
                string app = ReadAppPath(Here);
                if (args[0] == "--restore") {
                    string text = RunNode(Here, "restore", app);
                    MessageBox.Show(text, Title, MessageBoxButtons.OK, MessageBoxIcon.Information);
                } else if (args[0] == "--status") {
                    MessageBox.Show(RunNode(Here, "status", app), Title, MessageBoxButtons.OK, MessageBoxIcon.Information);
                } else {
                    RunNode(Here, "apply", app);
                    Process.Start(new ProcessStartInfo(Path.Combine(app, "Antigravity.exe")) { UseShellExecute = true, WorkingDirectory = app });
                }
                return 0;
            }
            Application.Run(new SetupForm()); return 0;
        } catch (Exception error) {
            string message = "Không hoàn tất được thao tác.\r\n\r\n" + error.Message;
            if (args.Length > 0 && (args[0] == "--verify" || args[0] == "--test-install" || args[0] == "--install")) {
                File.WriteAllText(Path.Combine(Here, "installer-test-error.txt"), message, Encoding.UTF8);
                return 1;
            }
            MessageBox.Show(message, Title, MessageBoxButtons.OK, MessageBoxIcon.Warning); return 1;
        }
    }

    static void ExtractPayload(string destination) {
        Directory.CreateDirectory(destination);
        using (Stream embedded = Assembly.GetExecutingAssembly().GetManifestResourceStream("payload.zip")) {
            if (embedded == null) throw new Exception("Thiếu dữ liệu bộ cài.");
            using (var zip = new ZipArchive(embedded, ZipArchiveMode.Read)) {
                foreach (var entry in zip.Entries) {
                    string name=entry.FullName.Replace('\\','/');
                    if (!PayloadFiles.Contains(name) && !name.StartsWith("runtime/") && !name.StartsWith("model/") && !name.StartsWith("licenses/") && !name.StartsWith("plugin/")) throw new Exception("Tên tệp không hợp lệ trong bộ cài.");
                    string path = Path.GetFullPath(Path.Combine(destination,name.Replace('/',Path.DirectorySeparatorChar)));
                    string safeRoot=Path.GetFullPath(destination).TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar;
                    if(!path.StartsWith(safeRoot,StringComparison.OrdinalIgnoreCase))throw new Exception("Đường dẫn giải nén không hợp lệ.");
                    Directory.CreateDirectory(Path.GetDirectoryName(path));
                    if(name.EndsWith("/"))continue;
                    using (var input = entry.Open()) using (var output = File.Create(path)) input.CopyTo(output);
                }
            }
        }
        foreach (string file in PayloadFiles) if (!File.Exists(Path.Combine(destination, file))) throw new Exception("Thiếu tệp " + file);
        foreach(string file in new[]{"runtime/python.exe","model/model.bin","model/source.spm","model/target.spm"})if(!File.Exists(Path.Combine(destination,file.Replace('/',Path.DirectorySeparatorChar))))throw new Exception("Thiếu thành phần dịch offline "+file);
    }

    static void VerifyPayload(string destination) {
        ExtractPayload(destination);
        RunProcess(Path.Combine(destination, "node.exe"), "--version", destination);
        RunProcess(Path.Combine(destination, "node.exe"), "--check " + Q(Path.Combine(destination, "patcher.cjs")), destination);
        RunProcess(Path.Combine(destination,"runtime","python.exe"),"-I "+Q(Path.Combine(destination,"translator.py"))+" --self-test",destination);
        RunProcess(Path.Combine(destination,"node.exe"),Q(Path.Combine(destination,"install-plugin.cjs"))+" --verify",destination);
        File.WriteAllText(Path.Combine(destination, "verification.txt"), "Embedded payload extraction and bundled Node.js execution passed.\r\n", Encoding.UTF8);
    }

    static string RunProcess(string executable, string arguments, string directory) {
        var info = new ProcessStartInfo(executable, arguments) {
            WorkingDirectory = directory, UseShellExecute = false, CreateNoWindow = true,
            RedirectStandardOutput = true, RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8
        };
        using (var process = new Process()) {
            process.StartInfo = info;
            process.Start();
            var stdout = process.StandardOutput.ReadToEndAsync();
            var stderr = process.StandardError.ReadToEndAsync();
            if (!process.WaitForExit(90000)) { process.Kill(); throw new Exception("Thao tác quá thời gian chờ."); }
            Task.WaitAll(stdout, stderr);
            string output = stdout.Result.Trim(), error = stderr.Result.Trim();
            if (process.ExitCode != 0) {
                string detail = String.IsNullOrEmpty(error) ? output : error;
                if (detail.Contains("EPERM") || detail.Contains("EACCES")) detail += "\r\n\r\nHãy thoát Antigravity, kể cả biểu tượng ở khay hệ thống, rồi thử lại. Nếu ứng dụng nằm trong Program Files, tài khoản cần có quyền ghi vào thư mục đó.";
                throw new Exception(detail);
            }
            return output;
        }
    }
    static string RunNode(string bundle, string command, string app) {
        return RunProcess(Path.Combine(bundle, "node.exe"), Q(Path.Combine(bundle, "patcher.cjs")) + " " + command + " " + Q("--app=" + app), bundle);
    }
    static string ReadAppPath(string bundle) {
        string config = Path.Combine(bundle, "antigravity-path.txt");
        if (!File.Exists(config)) throw new Exception("Chưa có đường dẫn Antigravity. Hãy chạy lại bộ cài.");
        string app = File.ReadAllText(config, Encoding.UTF8).Trim();
        ValidateApp(app); return app;
    }
    static void ValidateApp(string app) {
        if (String.IsNullOrWhiteSpace(app) || !File.Exists(Path.Combine(app, "Antigravity.exe"))) throw new Exception("Hãy chọn đúng tệp Antigravity.exe đã cài trên máy.");
        if (!File.Exists(Path.Combine(app, "resources", "app.asar"))) throw new Exception("Đây không phải họ Antigravity desktop được bộ cài này hỗ trợ. Bản IDE dựa trên VS Code cần bộ tích hợp riêng. Ứng dụng của bạn chưa bị thay đổi.");
    }
    static string FindApp() {
        string[] candidates = {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "antigravity"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Antigravity"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Antigravity")
        };
        foreach (string candidate in candidates) if (File.Exists(Path.Combine(candidate, "Antigravity.exe"))) return candidate;
        foreach (RegistryKey hive in new[] { Registry.CurrentUser, Registry.LocalMachine }) {
            using (RegistryKey uninstall = hive.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall")) {
                if (uninstall == null) continue;
                foreach (string name in uninstall.GetSubKeyNames()) using (RegistryKey key = uninstall.OpenSubKey(name)) {
                    if (key == null || !Convert.ToString(key.GetValue("DisplayName")).Equals("Antigravity", StringComparison.OrdinalIgnoreCase)) continue;
                    string location = Convert.ToString(key.GetValue("InstallLocation"));
                    if (!String.IsNullOrEmpty(location) && File.Exists(Path.Combine(location, "Antigravity.exe"))) return location;
                }
            }
        }
        return "";
    }
    static bool AppRunning(string app) {
        foreach (Process process in Process.GetProcessesByName("Antigravity")) {
            try { if (process.MainWindowHandle != IntPtr.Zero && String.Equals(process.MainModule.FileName, Path.Combine(app, "Antigravity.exe"), StringComparison.OrdinalIgnoreCase)) return true; }
            catch { /* If access is unavailable, the atomic file write still refuses a locked file. */ }
            finally { process.Dispose(); }
        }
        return false;
    }
    static void InstallCore(string app, string destination, bool shortcuts, string previousBundle = null) {
        app = Path.GetFullPath(app); destination = Path.GetFullPath(destination);
        ValidateApp(app);
        // No force-closing user processes or deleting user data.
        if (shortcuts && AppRunning(app)) throw new Exception("Antigravity vẫn đang chạy. Hãy thoát ứng dụng, kể cả khay hệ thống, rồi bấm Cài đặt lại.");
        if (shortcuts) {
            try { using (var check = File.Open(Path.Combine(app,"resources","app.asar"),FileMode.Open,FileAccess.Read,FileShare.None)) { } }
            catch (IOException) { throw new Exception("Tệp ứng dụng đang được sử dụng. Hãy thoát Antigravity, kể cả khay hệ thống, rồi thử lại."); }
        }
        ExtractPayload(destination);
        try { RunNode(destination, "check", app); }
        catch (Exception originalError) {
            if (!originalError.Message.Contains("chưa có hồ sơ sao lưu")) throw;
            string[] oldFolders = { previousBundle, Path.Combine(Here,"antigravity-tieng-viet"), Here,
                Path.Combine(Environment.CurrentDirectory,"antigravity-tieng-viet"), Environment.CurrentDirectory };
            bool imported = false;
            foreach (string folder in oldFolders.Where(x=>!String.IsNullOrWhiteSpace(x)).Distinct(StringComparer.OrdinalIgnoreCase)) {
                if (!File.Exists(Path.Combine(folder,"state.json"))) continue;
                try {
                    RunProcess(Path.Combine(destination,"node.exe"),Q(Path.Combine(destination,"patcher.cjs"))+" import-backup "+Q("--app="+app)+" "+Q("--from="+folder),destination);
                    imported=true;break;
                } catch { /* A nonmatching backup is never used. */ }
            }
            if (!imported) throw new Exception("Antigravity đã được Việt hóa nhưng bộ cài chưa nhận được bản sao lưu gốc.\r\n\r\nBấm Chọn bộ Việt hóa cũ và chọn thư mục có state.json cùng thư mục backups, rồi bấm Cài đặt lại. Không chọn thư mục cài Antigravity ở bước này.");
            RunNode(destination,"check",app);
        }
        RunProcess(Path.Combine(destination,"runtime","python.exe"),"-I "+Q(Path.Combine(destination,"translator.py"))+" --self-test",destination);
        RunNode(destination, "apply", app);
        if(shortcuts) RunProcess(Path.Combine(destination,"node.exe"),Q(Path.Combine(destination,"install-plugin.cjs")),destination);
        string installedExe = Path.Combine(destination, "AntigravityVietnamese.exe");
        if (!String.Equals(Self, installedExe, StringComparison.OrdinalIgnoreCase)) File.Copy(Self, installedExe, true);
        File.WriteAllText(Path.Combine(destination, "antigravity-path.txt"), app, new UTF8Encoding(false));
        if (shortcuts) {
            string start = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), Title);
            Directory.CreateDirectory(start);
            Shortcut(Path.Combine(start, "Antigravity tiếng Việt.lnk"), installedExe, "--launch", app);
            Shortcut(Path.Combine(start, "Khôi phục giao diện gốc.lnk"), installedExe, "--restore", app);
            Shortcut(Path.Combine(start, "Trạng thái bản Việt hóa.lnk"), installedExe, "--status", app);
            Shortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Antigravity tiếng Việt.lnk"), installedExe, "--launch", app);
        }
    }
    static void Shortcut(string file, string exe, string args, string app) {
        // The COM writer may use an ANSI path; write an ASCII temporary filename then copy through Unicode APIs.
        string temporary = Path.Combine(Path.GetTempPath(), "agvi-" + Guid.NewGuid().ToString("N") + ".lnk");
        dynamic shell = Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));
        dynamic link = shell.CreateShortcut(temporary);
        link.TargetPath = exe; link.Arguments = args; link.WorkingDirectory = Path.GetDirectoryName(exe);
        link.IconLocation = Path.Combine(app, "Antigravity.exe") + ",0"; link.WindowStyle = 1; link.Save();
        File.Copy(temporary, file, true); File.Delete(temporary);
    }

    sealed class SetupForm : Form {
        string previousBundle;
        readonly TextBox appPath;
        readonly Button install;
        readonly Label status;
        public SetupForm() {
            Text = "Cài đặt " + Title; ClientSize = new Size(700, 410);
            MinimumSize = new Size(716,449); MaximumSize = new Size(716,449);
            StartPosition = FormStartPosition.CenterScreen; Font = new Font("Segoe UI",10);
            BackColor = Color.White; AutoScaleMode = AutoScaleMode.None; MaximizeBox = false;
            Controls.Add(new Label { Text = "Cài đặt Antigravity tiếng Việt", Font = new Font("Segoe UI",18,FontStyle.Bold), Location=new Point(28,23), Size=new Size(640,42) });
            Controls.Add(new Label { Text = "Việt hóa giao diện + Office Preview + điều khiển Windows qua MCP.\r\nKèm bộ chạy; không cần cài Python, Node.js hoặc API key riêng.", Location=new Point(30,77),Size=new Size(640,53) });
            Controls.Add(new Label { Text="Thư mục chứa Antigravity.exe",Location=new Point(30,145),Size=new Size(600,25) });
            appPath = new TextBox { Text=FindApp(), Location=new Point(30,175),Size=new Size(525,28) };Controls.Add(appPath);
            var browse = new Button { Text="Chọn…",Location=new Point(565,172),Size=new Size(100,32) };Controls.Add(browse);
            browse.Click += delegate {
                using (var picker = new OpenFileDialog { Title="Chọn Antigravity.exe", Filter="Antigravity|Antigravity.exe",CheckFileExists=true }) {
                    if (picker.ShowDialog(this)==DialogResult.OK) appPath.Text=Path.GetDirectoryName(picker.FileName);
                }
            };
            Controls.Add(new Label { Text="Thoát Antigravity trước khi cài. Windows 10/11 x64; App 2.34.0+.\r\nPreview chỉ xem DOCX/XLSX/PPTX. Công cụ Windows dùng mô hình của App.\r\nBộ dịch chạy local, mô hình tự tắt khi hết việc. Không dành cho bản IDE.", Location=new Point(30,225),Size=new Size(640,70), ForeColor=Color.FromArgb(65,65,65) });
            status = new Label { Text="Bộ Việt hóa tự tạo, không phải sản phẩm chính thức của Google.", Location=new Point(30,305),Size=new Size(640,40) };Controls.Add(status);
            var oldBundle = new Button { Text="Chọn bộ Việt hóa cũ…",Location=new Point(30,355),Size=new Size(220,34) };Controls.Add(oldBundle);
            oldBundle.Click += delegate {
                using (var picker = new FolderBrowserDialog { Description="Chọn thư mục bộ Việt hóa cũ có state.json và thư mục backups",ShowNewFolderButton=false }) {
                    if(picker.ShowDialog(this)==DialogResult.OK) {
                        previousBundle=picker.SelectedPath;
                        status.Text="Đã chọn bộ cũ. Bấm Cài đặt để kiểm tra hồ sơ và bản sao lưu.";
                    }
                }
            };
            install = new Button { Text="Cài đặt",Location=new Point(445,355),Size=new Size(105,34) };Controls.Add(install);
            var close = new Button { Text="Đóng",Location=new Point(562,355),Size=new Size(105,34) };Controls.Add(close);
            close.Click += delegate { Close(); };
            install.Click += async delegate {
                string chosen = appPath.Text.Trim();
                install.Enabled=false; browse.Enabled=false; appPath.Enabled=false; close.Enabled=false;oldBundle.Enabled=false;
                status.Text="Đang kiểm tra, sao lưu và áp dụng bản dịch…";
                try {
                    await Task.Run(()=>InstallCore(chosen,UserInstall,true,previousBundle));
                    status.Text="Đã cài xong. Mở bằng biểu tượng Antigravity tiếng Việt trên Desktop.";
                    MessageBox.Show(this,"Cài đặt thành công.\r\n\r\nMở Antigravity tiếng Việt trên Desktop. Trong Customizations > Installed, kiểm tra plugin Windows & Office. Bấm Office Preview ở thanh bên rồi Chọn tài liệu để xem DOCX/XLSX/PPTX.\r\n\r\nCông cụ Windows có thể thao tác máy; giữ chế độ duyệt công cụ phù hợp. Nếu chưa thấy plugin, thoát hẳn rồi mở lại App.\r\n\r\nKhôi phục giao diện gốc trong Start chỉ gỡ bản Việt hóa; tắt/gỡ plugin riêng trong Customizations.",Title,MessageBoxButtons.OK,MessageBoxIcon.Information);
                } catch (Exception error) {
                    status.Text="Chưa hoàn tất. Xem thông báo rồi thử lại.";
                    MessageBox.Show(this,error.Message,Title,MessageBoxButtons.OK,MessageBoxIcon.Warning);
                } finally {install.Enabled=true;browse.Enabled=true;appPath.Enabled=true;close.Enabled=true;oldBundle.Enabled=true;}
            };
        }
    }
}
