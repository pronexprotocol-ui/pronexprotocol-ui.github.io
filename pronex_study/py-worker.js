/* Pronex_Study · Python no próprio dispositivo (Pyodide 0.26.4, licença MPL-2.0).
   Corre o código do aluno e os testes do exercício. Nada é enviado para fora do dispositivo. */
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
let py = null;
(async () => {
  try {
    py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
    self.postMessage({ ready: true });
  } catch (e) { self.postMessage({ error: 'Não foi possível carregar o Python: ' + (e && e.message || e) }); }
})();
const HARNESS = `
import sys, io, traceback, builtins
def __pronex_run(code, tests):
    out = io.StringIO()
    old = sys.stdout, sys.stderr
    sys.stdout = out; sys.stderr = out
    g = {'__name__': '__main__'}
    def _no_input(*a, **k):
        raise RuntimeError('input() não está disponível aqui: usa valores no próprio código.')
    g['input'] = _no_input
    err = ''
    try:
        exec(compile(code, 'o_teu_codigo.py', 'exec'), g)
    except Exception as e:
        tb = traceback.format_exception(type(e), e, e.__traceback__)
        tb = [l for l in tb if 'o_teu_codigo.py' in l or not l.startswith('  File')]
        err = ''.join(tb[-3:]).strip()
    res = []
    if not err:
        for t in tests:
            try:
                exec(t.get('codigo', ''), g)
                res.append({'ok': True, 'msg': t.get('msg', ''), 'codigo': t.get('codigo', '')})
            except AssertionError as e:
                res.append({'ok': False, 'msg': t.get('msg', ''), 'codigo': t.get('codigo', ''), 'err': str(e) or 'O resultado não é o esperado.'})
            except Exception as e:
                res.append({'ok': False, 'msg': t.get('msg', ''), 'codigo': t.get('codigo', ''), 'err': type(e).__name__ + ': ' + str(e)})
    sys.stdout, sys.stderr = old
    return {'out': out.getvalue()[:20000], 'err': err, 'tests': res}
`;
let harnessReady = false;
self.onmessage = async (e) => {
  const { id, code, tests } = e.data || {};
  if (!py) { self.postMessage({ id, out: '', err: 'O Python ainda está a carregar.', tests: [] }); return; }
  try {
    if (!harnessReady) { py.runPython(HARNESS); harnessReady = true; }
    const fn = py.globals.get('__pronex_run');
    const r = fn(code, py.toPy(tests || []));
    const js = r.toJs({ dict_converter: Object.fromEntries });
    r.destroy(); fn.destroy();
    self.postMessage(Object.assign({ id }, js));
  } catch (x) {
    self.postMessage({ id, out: '', err: String(x && x.message || x), tests: [] });
  }
};
