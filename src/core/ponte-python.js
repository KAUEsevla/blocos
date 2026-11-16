// Código Python do adapter, igual no navegador e no Node (contracts/executor-core.md da 008;
// ampliado pela spec 009, contracts/adapter-core.md).
// O Python executa os passos e devolve dados brutos; a interpretação fica em executor-core.js.
// Usa só a interface pública do Core: meuPia.compiler.main(arquivo, saida) (princípio I).
// A falta de um compilar(texto) público (meuPia/core#14) é contornada aqui: main.por e
// output/main.py existem só no sistema de arquivos virtual do Pyodide (research R-04 da 009).

export const PONTE_PYTHON = `
import io
import os
import sys
import traceback


class _Escrita:
    # stdout do programa: grava no buffer e, se houver, repassa cada pedaço na hora (R-05).
    def __init__(self, ao_escrever):
        self.buffer = io.StringIO()
        self.ao_escrever = ao_escrever

    def write(self, texto):
        self.buffer.write(texto)
        if self.ao_escrever is not None and texto:
            self.ao_escrever(texto)
        return len(texto)

    def flush(self):
        pass


def _meupia_compilar(codigo):
    from meuPia.compiler import main

    os.makedirs("output", exist_ok=True)
    if os.path.exists("output/main.py"):
        os.remove("output/main.py")
    with open("main.por", "w", encoding="utf-8") as arquivo:
        arquivo.write(codigo)

    original = sys.stdout
    buffer = io.StringIO()
    sys.stdout = buffer
    falha = ""
    try:
        retorno = main("main.por", "output")
    except (SystemExit, Exception):
        # Falha inesperada do compilador: vira "não compilou" com o rastro (R-04, item 3).
        retorno = None
        falha = traceback.format_exc()
    finally:
        sys.stdout = original

    compilou = retorno == 0 and os.path.exists("output/main.py")
    return {"compilou": compilou, "saidaCompilador": buffer.getvalue() + falha}


def _meupia_executar(ao_escrever=None):
    with open("output/main.py", "r", encoding="utf-8") as arquivo:
        codigo = arquivo.read()

    original = sys.stdout
    escrita = _Escrita(ao_escrever)
    sys.stdout = escrita
    erro = None
    try:
        exec(codigo, {"__name__": "__main__"})
    except SystemExit:
        pass
    except Exception as e:
        erro = {"tipo": type(e).__name__, "mensagem": str(e), "rastro": traceback.format_exc()}
    finally:
        sys.stdout = original
    return {"saida": escrita.buffer.getvalue(), "erro": erro}
`;
