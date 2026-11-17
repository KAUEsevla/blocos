// Código Python do adapter, igual no navegador e no Node (contracts/executor-core.md da 008;
// ampliado pela spec 009, contracts/adapter-core.md).
// O Python executa os passos e devolve dados brutos; a interpretação fica em executor-core.js.
// Usa só a interface pública do Core: meuPia.compiler.main(arquivo, saida) (princípio I).
// A falta de um compilar(texto) público (meuPia/core#14) é contornada aqui: main.por e
// output/main.py existem só no sistema de arquivos virtual do Pyodide (research R-04 da 009).
// Spec 010 (contracts/adapter-core.md): entrada por lista própria, modo interativo e
// _meupia_compilado para reexecutar sem recompilar.

export const PONTE_PYTHON = `
import io
import os
import re
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


class _MeupiaPedidoEntrada(BaseException):
    # Spec 010 (R-02): o leia chegou sem valor no modo interativo. BaseException, para um
    # "except Exception" do programa nunca a capturar.
    def __init__(self, nome):
        super().__init__(nome)
        self.nome = nome


_LINHA_ATRIBUICAO = re.compile(r"\\s*([A-Za-z_]\\w*)\\s*=")


def _meupia_compilado():
    return os.path.exists("output/main.py")


def _meupia_executar(ao_escrever=None, entrada=None, interativo=False):
    with open("output/main.py", "r", encoding="utf-8") as arquivo:
        codigo = arquivo.read()
    linhas = codigo.split("\\n")
    fila = list(entrada or [])

    # Spec 010 (R-03): substitui o input() do programa só no ambiente do exec. Devolve o
    # valor exatamente como digitado (FR-004). Lacuna do Core: o nome da variável sai da
    # linha que chamou o input() (nome = ...input()...), não de uma interface pública.
    def _meupia_input(prompt=""):
        if fila:
            return fila.pop(0)
        if not interativo:
            raise EOFError()
        quadro = sys._getframe(1)
        nome = None
        if 0 < quadro.f_lineno <= len(linhas):
            casou = _LINHA_ATRIBUICAO.match(linhas[quadro.f_lineno - 1])
            nome = casou.group(1) if casou else None
        raise _MeupiaPedidoEntrada(nome)

    original = sys.stdout
    escrita = _Escrita(ao_escrever)
    sys.stdout = escrita
    erro = None
    pedido = None
    try:
        exec(codigo, {"__name__": "__main__", "input": _meupia_input})
    except _MeupiaPedidoEntrada as e:
        pedido = {"variavel": e.nome}
    except SystemExit:
        pass
    except Exception as e:
        erro = {"tipo": type(e).__name__, "mensagem": str(e), "rastro": traceback.format_exc()}
    finally:
        sys.stdout = original
    return {"saida": escrita.buffer.getvalue(), "erro": erro, "pedido": pedido}
`;
