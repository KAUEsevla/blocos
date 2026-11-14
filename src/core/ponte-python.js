// Código Python do adapter, igual no navegador e no Node (contracts/executor-core.md).
// O Python executa os passos e devolve dados brutos; a interpretação fica em executor-core.js.
// Usa só a interface pública do Core: meuPia.compiler.main(arquivo, saida) (princípio I).

export const PONTE_PYTHON = `
import io
import os
import sys


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
    try:
        retorno = main("main.por", "output")
    finally:
        sys.stdout = original

    compilou = retorno == 0 and os.path.exists("output/main.py")
    return {"compilou": compilou, "saidaCompilador": buffer.getvalue()}


def _meupia_executar():
    with open("output/main.py", "r", encoding="utf-8") as arquivo:
        codigo = arquivo.read()

    original = sys.stdout
    buffer = io.StringIO()
    sys.stdout = buffer
    erro = None
    try:
        exec(codigo, {"__name__": "__main__"})
    except SystemExit:
        pass
    except Exception as e:
        erro = {"tipo": type(e).__name__, "mensagem": str(e)}
    finally:
        sys.stdout = original
    return {"saida": buffer.getvalue(), "erro": erro}
`;
