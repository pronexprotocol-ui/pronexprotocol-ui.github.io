/* Pronex_Study · Python no próprio dispositivo (Pyodide 0.26.4, licença MPL-2.0).
   Corre o código do aluno e os testes do exercício. Nada é enviado para fora do dispositivo.
   Cada execução começa limpa: pasta temporária própria, funções do Python repostas e módulos do aluno esquecidos. */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
let py = null;
(async () => {
  try {
    py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
    self.postMessage({ ready: true });
  } catch (e) { self.postMessage({ error: 'Não foi possível carregar o Python: ' + (e && e.message || e) }); }
})();
const HARNESS = `
import sys, io, os, traceback, builtins, tempfile, linecache
_B = dict(builtins.__dict__)
_MODS = set(sys.modules)
_HOME = os.getcwd()
LIM = 20000
class _Out(io.StringIO):
    def write(self, s):
        if self.tell() > LIM: return len(s)
        return super().write(s)
def __pronex_run(code, tests):
    # repor o que um exercício anterior possa ter mudado
    for k in list(builtins.__dict__):
        if k not in _B: del builtins.__dict__[k]
    builtins.__dict__.update(_B)
    _T = tempfile.gettempdir()
    for m in list(sys.modules):
        f = getattr(sys.modules.get(m), '__file__', None) or ''
        if m not in _MODS and (f.startswith(_T) or f.startswith(_HOME + '/')): del sys.modules[m]
    d = tempfile.mkdtemp(prefix='ex_')
    os.chdir(d)
    out = _Out()
    old = sys.stdout, sys.stderr
    sys.stdout = out; sys.stderr = out
    g = {'__name__': '__main__', '__builtins__': builtins}
    def _no_input(*a, **k):
        raise RuntimeError('input() não está disponível aqui: usa valores no próprio código.')
    g['input'] = _no_input
    err = ''
    linecache.cache['o_teu_codigo.py'] = (len(code), None, code.splitlines(True), 'o_teu_codigo.py')
    g['__file__'] = 'o_teu_codigo.py'
    res = []
    try:
        try:
            exec(compile(code, 'o_teu_codigo.py', 'exec'), g)
        except SystemExit:
            pass
        except BaseException as e:
            tb = traceback.format_exception(type(e), e, e.__traceback__)
            tb = [l for l in tb if 'o_teu_codigo.py' in l or not l.startswith('  File')]
            err = ''.join(tb[-3:]).strip()
        if not err:
            for t in tests:
                gt = g  # alguns testes trocam uma função para ver se os testes do aluno a apanham
                try:
                    exec(t.get('codigo', ''), gt)
                    res.append({'ok': True, 'msg': t.get('msg', ''), 'codigo': t.get('codigo', '')})
                except AssertionError as e:
                    res.append({'ok': False, 'msg': t.get('msg', ''), 'codigo': t.get('codigo', ''), 'err': str(e) or 'O resultado não é o esperado.'})
                except BaseException as e:
                    res.append({'ok': False, 'msg': t.get('msg', ''), 'codigo': t.get('codigo', ''), 'err': type(e).__name__ + ': ' + str(e)})
    finally:
        sys.stdout, sys.stderr = old
        os.chdir(_HOME)
    txt = out.getvalue()
    if len(txt) > LIM:
        txt = txt[:LIM] + '\\n… (a saída foi cortada: o programa escreveu mais de 20 000 caracteres)'
    return {'out': txt, 'err': err, 'tests': res}
`;
let harnessReady = false;
self.onmessage = async (e) => {
  const { id, code, tests } = e.data || {};
  if (!py) { self.postMessage({ id, out: '', err: 'O Python ainda está a carregar.', tests: [] }); return; }
  try {
    if (!harnessReady) { py.runPython(HARNESS); harnessReady = true; }
    // módulos da biblioteca padrão que o Pyodide descarrega à parte (ex.: sqlite3)
    let pkgErr = '';
    try { await py.loadPackagesFromImports(String(code || '') + '\n' + (tests || []).map(t => t.codigo || '').join('\n')); }
    catch (x) { pkgErr = 'Este exercício precisa de um módulo que o Python descarrega da internet da primeira vez. Liga-te à internet e tenta outra vez.'; }
    self.postMessage({ id, started: true });
    const fn = py.globals.get('__pronex_run');
    const r = fn(code, py.toPy(tests || []));
    const js = r.toJs({ dict_converter: Object.fromEntries });
    r.destroy(); fn.destroy();
    if (pkgErr && /ModuleNotFoundError/.test(js.err || '')) js.err = pkgErr + '\n\n' + js.err;
    self.postMessage(Object.assign({ id }, js));
  } catch (x) {
    self.postMessage({ id, started: true });
    self.postMessage({ id, out: '', err: String(x && x.message || x), tests: [] });
  }
};
