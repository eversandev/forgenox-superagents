# ForgeNox SuperAgents: teste isolado na Railway

## Estado

Preparação baseada no código do fork, sem implantação validada. Não alterar os
projetos existentes do ForgeNox. Branding e PT-BR serão etapas posteriores.

## Arquitetura inicial

Uma instância do Octop, com o dashboard servido pelo próprio FastAPI, SQLite
e volume persistente em `/data/.octop`. Usar a branch `dev/forgenox` do
repositório `eversandev/forgenox-superagents`.

O Dockerfile existente compila o painel e instala as dependências usando
`uv.lock`. Não é necessário Redis. Um provedor LLM é necessário para conversar
com os agentes. PostgreSQL é suportado, mas não elimina a necessidade de
persistir os arquivos dos agentes e as configurações locais.

## Configuração proposta (ainda não aplicada)

- Novo projeto privado `forgenox-superagents-test`, ambiente `staging`, no
  workspace do usuário. Não reutilizar serviços, volumes ou segredos existentes.
- Serviço `superagents`, raiz do repositório `/`, Dockerfile `docker/Dockerfile`.
- Preservar o ENTRYPOINT da imagem, sem comando de início personalizado.
- Healthcheck `/api/health`, limite de espera de 300 segundos.
- Uma única réplica, sem suspensão automática, reinício `ON_FAILURE` com 3 tentativas.
- Volume novo montado em `/data/.octop`, antes da primeira inicialização.
- Inicialização e migrações no start normal: volumes não estão disponíveis no
  build nem no pre-deploy da Railway.
- Usar o HTTPS da Railway e manter o TLS interno do Octop desativado.

Variáveis não secretas:

| Nome | Valor |
| --- | --- |
| `OCTOP_HOME` | `/data/.octop` |
| `OCTOP_BIND_HOST` | `0.0.0.0` |
| `OCTOP_DATABASE_DRIVER` | `sqlite` |
| `OCTOP_DEFAULT_TIMEZONE` | `America/Sao_Paulo` |
| `OCTOP_REQUIRE_SETUP_PASSWORD` | `true` |
| `LANGFUSE_TRACING_ENABLED` | `false` |

A porta fornecida em `PORT` é repassada para `OCTOP_PORT` pelo entrypoint.
Sem `PORT`, continuam válidos `OCTOP_PORT` e o padrão 8088.

Não versionar senhas nem chaves LLM. Sem `OCTOP_DEFAULT_PASSWORD`, o entrypoint
abre o assistente de configuração protegido por senha. Obter a senha do arquivo
`/data/.octop/octop-login.txt` por acesso autenticado ao serviço e concluir a
criação do administrador no navegador. O upstream também pode imprimir a senha
de configuração no boot; tratar os logs como sensíveis. Manter o controle de
acesso do projeto Railway restrito ao usuário.

## Critérios para aprovar o teste

1. Build Docker concluído e processo ativo na porta atribuída.
2. `/api/health` responde; essa rota é de liveness e retorna `ok: true` mesmo
   antes de configurar usuários. Verificar também `db` e o login após o setup.
3. Completar setup, autenticar, confirmar que uma API protegida recusa acesso
   sem token e criar um agente com um provedor LLM de testes.
4. Enviar uma mensagem e confirmar a resposta. Verificar escrita e leitura de
   um arquivo no workspace do agente.
5. Reiniciar/reimplantar o mesmo serviço mantendo o volume. Confirmar usuário,
   configurações do provedor, agente, conversa e arquivo preservados; o setup
   não deve reabrir. Não presumir que o token de login anterior continuará válido.
6. Só depois avaliar branding e PT-BR. O frontend usa
   `dashboard/src/i18n.ts` e `dashboard/src/locales/`; o backend usa
   `src/octop/i18n/` e a resolução em `src/octop/infra/utils/locale.py`.

## Limites do primeiro teste

O Dockerfile instala extras de OCR e embeddings locais; medir memória e tempo
de build antes de prometer dimensionamento. O runtime de navegador requer
validação própria: instalar Playwright como pacote não comprova a presença de
Chromium. Controle de desktop, Android e execução isolada por Docker também
não estão validados na Railway. Não disponibilizar este teste para usuários
finais antes de validar essas capacidades e o isolamento dos agentes.

Preservar integralmente `LICENSE`, `Copyright (c) 2026 Octop` e os avisos MIT
e de terceiros. O fork público não deve receber dados de produção.

## Referências

- https://docs.railway.com/config-as-code/reference
- https://docs.railway.com/guides/build-time-vs-runtime-secrets

A documentação consultada marca `railway.json`/`railway.toml` como obsoletos
para novos serviços. Por isso esta preparação usa configurações explícitas do
serviço, sem acrescentar um arquivo legado.
