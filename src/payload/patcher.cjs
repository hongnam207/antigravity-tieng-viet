'use strict';
// Local, dependency-free ASAR patcher. No network calls or account access.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const ROOT = __dirname;
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const blockPattern = /\/\* AGVI-BEGIN \*\/[\s\S]*?\/\* AGVI-END \*\//g;
function parseAsar(buffer) {
  if (buffer.length < 16 || buffer.readUInt32LE(0) !== 4) throw Error('Not a supported ASAR archive');
  const headerSize = buffer.readUInt32LE(4), jsonSize = buffer.readUInt32LE(12);
  if (headerSize < 8 || jsonSize > headerSize - 8 || headerSize + 8 > buffer.length) throw Error('Invalid ASAR header');
  const header = JSON.parse(buffer.subarray(16, 16 + jsonSize).toString('utf8'));
  const base = 8 + headerSize;
  const entries = new Map();
  function visit(files, prefix = '') {
    for (const [name, item] of Object.entries(files)) {
      const key = prefix + name;
      if (item.files) visit(item.files, key + '/');
      else if (!item.unpacked && !item.link) {
        const offset = Number(item.offset), size = item.size;
        if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(size) || offset < 0 || size < 0 || base + offset + size > buffer.length) throw Error('Invalid file bounds: ' + key);
        entries.set(key, { item, data: buffer.subarray(base + offset, base + offset + size) });
      }
    }
  }
  visit(header.files);
  return { header, entries };
}
function readText(archive, key) {
  const file = archive.entries.get(key);
  if (!file) throw Error('Required file not found: ' + key);
  return file.data.toString('utf8');
}
function packAsar(archive, changes) {
  const body = []; let offset = 0;
  for (const [key, file] of archive.entries) {
    const data = changes.has(key) ? Buffer.from(changes.get(key), 'utf8') : file.data;
    file.item.offset = String(offset); file.item.size = data.length;
    if (changes.has(key)) {
      const blockSize = file.item.integrity?.blockSize || 4194304;
      const blocks = [];
      for (let i = 0; i < data.length; i += blockSize) blocks.push(hash(data.subarray(i, i + blockSize)));
      file.item.integrity = { algorithm: 'SHA256', hash: hash(data), blockSize, blocks };
    }
    body.push(data); offset += data.length;
  }
  const json = Buffer.from(JSON.stringify(archive.header));
  const padding = (4 - (json.length % 4)) % 4;
  const prefix = Buffer.alloc(16);
  prefix.writeUInt32LE(4, 0); prefix.writeUInt32LE(8 + json.length + padding, 4);
  prefix.writeUInt32LE(4 + json.length + padding, 8); prefix.writeUInt32LE(json.length, 12);
  return Buffer.concat([prefix, json, Buffer.alloc(padding), ...body]);
}
function appRoot() {
  const explicit = process.argv.find(a => a.startsWith('--app='));
  if (explicit) {
    const selected = path.resolve(explicit.slice(6));
    if (!fs.existsSync(path.join(selected, 'resources', 'app.asar'))) throw Error('Không tìm thấy app.asar trong thư mục Antigravity đã chọn. Không sửa ứng dụng khác.');
    return selected;
  }
  const candidates = [explicit?.slice(6), path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity'), path.join(process.env.ProgramFiles || '', 'Antigravity')].filter(Boolean);
  const found = candidates.find(p => fs.existsSync(path.join(p, 'resources', 'app.asar')));
  if (!found) throw Error('Không tìm thấy bản Antigravity desktop dùng app.asar. Bản IDE dựa trên VS Code cần bộ tích hợp riêng.');
  return path.resolve(found);
}
function readManifest() {
  const file = path.join(ROOT, 'state.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { installs: {} };
}
function writeManifest(state) {
  const temp = path.join(ROOT, 'state.json.tmp');
  fs.writeFileSync(temp, JSON.stringify(state, null, 2)); fs.renameSync(temp, path.join(ROOT, 'state.json'));
}
function syntaxCheck(source, name) {
  const result = cp.spawnSync(process.execPath, ['--check', '-'], { input: source, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw Error('Kiểm tra cú pháp thất bại: ' + name + '\n' + result.stderr);
}
function getPayload() {
  const dictionary = JSON.parse(fs.readFileSync(path.join(ROOT, 'vi.json'), 'utf8'));
  if (Object.keys(dictionary).length < 50 || !Object.values(dictionary).every(v => typeof v === 'string')) throw Error('Từ điển dịch không hợp lệ');
  const fill = name => fs.readFileSync(path.join(ROOT, name), 'utf8').replace('/* AGVI-DICTIONARY */', JSON.stringify(dictionary)).replace('/* AGVI-RUNTIME */', JSON.stringify(ROOT));
  return { dictionary, renderer: fill('renderer.js'), native: fill('native.js') };
}
function planPatch(buffer, payload) {
  const archive = parseAsar(buffer);
  const pkg = JSON.parse(readText(archive, 'package.json'));
  if (!/antigravity/i.test(pkg.name || '') || !pkg.main) throw Error('Không nhận diện được cấu trúc Antigravity');
  const mainKey = pkg.main.replace(/\\/g, '/').replace(/^\.\//, '');
  const main = readText(archive, mainKey).replace(blockPattern, '');
  // Structural detection instead of byte offsets or a hard-coded version.
  const preloadKey = path.posix.join(path.posix.dirname(mainKey), 'preload.js');
  const preload = readText(archive, preloadKey).replace(blockPattern, '');
  if (!/require\(["']electron["']\)/.test(main) || !preload.includes('contextBridge') || !preload.includes('ipcRenderer')) {
    throw Error('Phiên bản này đã đổi cấu trúc. Giữ nguyên ứng dụng; cần cập nhật bộ tích hợp.');
  }
  const requireAt = main.match(/^.*require\(["']electron["']\).*$/m);
  if (!requireAt) throw Error('Không tìm được điểm tích hợp Electron');
  const at = requireAt.index + requireAt[0].length;
  const changes = new Map([
    [mainKey, main.slice(0, at) + '\n' + payload.native.trim() + '\n' + main.slice(at).replace(/^\s*/, '')],
    [preloadKey, preload.trimEnd() + '\n\n' + payload.renderer + '\n'],
  ]);
  for (const [key, text] of changes) syntaxCheck(text, key);
  const packed = packAsar(archive, changes);
  const checked = parseAsar(packed);
  for (const [key, text] of changes) {
    if (readText(checked, key) !== text || checked.entries.get(key).item.integrity.hash !== hash(Buffer.from(text))) throw Error('Kiểm tra dữ liệu đóng gói thất bại');
  }
  // All untouched packed files must be byte-identical.
  const original = parseAsar(buffer);
  for (const [key, file] of original.entries) {
    if (!changes.has(key) && !file.data.equals(checked.entries.get(key).data)) throw Error('Nội dung ngoài bản vá bị thay đổi: ' + key);
  }
  return { packed, version: pkg.version, files: [...changes.keys()] };
}
function commitAtomic(file, bytes) {
  const temp = file + '.agvi.tmp';
  const fd = fs.openSync(temp, 'w');
  try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  // Windows replacement is atomic on NTFS when no process locks the destination.
  try { fs.renameSync(temp, file); }
  catch (e) { try { fs.unlinkSync(temp); } catch {} throw Error('Không thay được tệp ứng dụng. Hãy thoát Antigravity rồi thử lại. ' + e.message); }
}
function importBackup(install, buffer, state, sourceFolder) {
  if (!sourceFolder) throw Error('Cần chọn thư mục bộ Việt hóa cũ có state.json và backups.');
  const source = fs.realpathSync(sourceFolder);
  const sourceState = JSON.parse(fs.readFileSync(path.join(source, 'state.json'), 'utf8').replace(/^\uFEFF/, ''));
  const currentHash = hash(buffer);
  const record = Object.values(sourceState.installs || {}).find(x => x && x.patchedHash === currentHash);
  if (!record) throw Error('Hồ sơ cũ không khớp chính xác bản Antigravity đang cài.');
  const backupFile = fs.realpathSync(path.resolve(source, record.backup));
  const relative = path.relative(source, backupFile);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw Error('Đường dẫn sao lưu nằm ngoài bộ Việt hóa cũ.');
  const original = fs.readFileSync(backupFile);
  if (hash(original) !== record.originalHash) throw Error('Mã kiểm tra của bản sao lưu không hợp lệ.');
  const oldArchive = parseAsar(original), currentArchive = parseAsar(buffer);
  const oldPackage = JSON.parse(readText(oldArchive, 'package.json'));
  const currentPackage = JSON.parse(readText(currentArchive, 'package.json'));
  if (oldPackage.name !== currentPackage.name || oldPackage.version !== currentPackage.version) throw Error('Bản sao lưu khác ứng dụng hoặc phiên bản.');
  const mainKey = oldPackage.main.replace(/\\/g, '/').replace(/^\.\//, '');
  const allowed = new Set([mainKey, path.posix.join(path.posix.dirname(mainKey), 'preload.js')]);
  if (oldArchive.entries.size !== currentArchive.entries.size) throw Error('Cấu trúc bản sao lưu không khớp.');
  for (const [key, entry] of oldArchive.entries) {
    const current = currentArchive.entries.get(key);
    if (!current) throw Error('Bản sao lưu thiếu tệp tương ứng.');
    if (entry.data.includes(Buffer.from('/* AGVI-BEGIN */'))) throw Error('Bản sao lưu đã bị Việt hóa, không phải bản gốc.');
    if (!allowed.has(key) && !entry.data.equals(current.data)) throw Error('Có thay đổi ngoài bản Việt hóa: ' + key);
  }
  const backup = path.join('backups', record.originalHash + '.asar');
  fs.mkdirSync(path.join(ROOT, 'backups'), { recursive: true });
  const destination = path.join(ROOT, backup);
  if (!fs.existsSync(destination)) fs.writeFileSync(destination, original, { flag: 'wx' });
  if (hash(fs.readFileSync(destination)) !== record.originalHash) throw Error('Bản sao lưu đích không hợp lệ.');
  state.installs[install] = { ...record, backup, migratedAt: new Date().toISOString() };
  writeManifest(state);
  return 'Đã nhận hồ sơ và bản sao lưu hợp lệ từ bộ Việt hóa cũ. Ứng dụng không bị thay đổi.';
}
function main() {
  const command = process.argv[2] || 'status';
  const install = appRoot(), file = path.join(install, 'resources', 'app.asar');
  const buffer = fs.readFileSync(file), currentHash = hash(buffer);
  const state = readManifest(), prior = state.installs[install];
  const archive = parseAsar(buffer), pkg = JSON.parse(readText(archive, 'package.json'));
  if (command === 'import-backup') {
    const source = process.argv.find(x => x.startsWith('--from='));
    console.log(importBackup(install, buffer, state, source?.slice(7))); return;
  }
  if (command === 'status') {
    console.log(JSON.stringify({ install, version: pkg.version, translated: prior?.patchedHash === currentHash, dictionaryEntries: Object.keys(getPayload().dictionary).length }, null, 2)); return;
  }
  if (command === 'restore') {
    if (!prior || prior.patchedHash !== currentHash) throw Error('Không khôi phục: ứng dụng đã đổi phiên bản hoặc không còn đúng bản vá. Không chép bản cũ đè lên bản mới.');
    const original = fs.readFileSync(path.join(ROOT, prior.backup));
    if (hash(original) !== prior.originalHash) throw Error('Bản sao lưu không hợp lệ');
    commitAtomic(file, original); delete state.installs[install];writeManifest(state);
    console.log('Đã khôi phục giao diện gốc. Mở lại ứng dụng để có hiệu lực.'); return;
  }
  if (!['apply', 'check'].includes(command)) throw Error('Lệnh hợp lệ: apply, check, status, restore');
  const payload = getPayload();
  const revision = hash(Buffer.from(payload.renderer + payload.native));
  if (prior?.patchedHash === currentHash && prior.revision === revision) {
    console.log('Đã Việt hóa; không cần thay đổi.'); return;
  }
  let original = buffer;
  if (prior?.patchedHash === currentHash) {
    original = fs.readFileSync(path.join(ROOT, prior.backup));
    if (hash(original) !== prior.originalHash) throw Error('Bản sao lưu không hợp lệ');
  } else if ([...archive.entries.values()].some(x => x.data.includes(Buffer.from('/* AGVI-BEGIN */')))) {
    throw Error('Phát hiện bản vá chưa có hồ sơ sao lưu tương ứng. Dừng để bảo vệ bản gốc.');
  }
  const plan = planPatch(original, payload);
  if (command === 'check') { console.log('Cấu trúc phù hợp, cú pháp và dữ liệu đóng gói hợp lệ. Phiên bản ' + plan.version); return; }
  const originalHash = hash(original), backup = path.join('backups', originalHash + '.asar');
  fs.mkdirSync(path.join(ROOT, 'backups'), { recursive: true });
  if (!fs.existsSync(path.join(ROOT, backup))) fs.writeFileSync(path.join(ROOT, backup), original, { flag: 'wx' });
  if (hash(fs.readFileSync(path.join(ROOT, backup))) !== originalHash) throw Error('Không xác minh được bản sao lưu');
  // Persist the intended transaction first so a failed/interrupted write remains recoverable.
  state.installs[install] = { version: plan.version, originalHash, patchedHash: hash(plan.packed), backup, revision, files: plan.files, updatedAt: new Date().toISOString() };
  writeManifest(state);
  try { commitAtomic(file, plan.packed); }
  catch (error) { if (prior) state.installs[install] = prior; else delete state.installs[install];writeManifest(state);throw error; }
  if (hash(fs.readFileSync(file)) !== state.installs[install].patchedHash) throw Error('Tệp sau cài đặt không khớp bản vá');
  console.log('Đã Việt hóa Antigravity ' + plan.version + '. Bản gốc đã được sao lưu.');
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { parseAsar, packAsar, planPatch, getPayload, hash, importBackup };
