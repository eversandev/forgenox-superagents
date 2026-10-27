# ForgeNox SuperAgents — desenvolvimento

Base: fork de https://github.com/TencentCloud/Octop.
Branch de desenvolvimento: `dev/forgenox`.

## Escopo planejado

- Branding ForgeNox: inventariar nome, logotipos, títulos e metadados antes de aplicar a identidade visual.
- Português do Brasil: inventariar a estrutura de internacionalização, adicionar PT-BR e revisar mensagens, datas e formatos mantendo os demais idiomas.
- Railway: avaliar build, comando de inicialização, porta, persistência, banco de dados, healthcheck e variáveis necessárias antes de preparar um ambiente de testes separado.

## Limites desta preparação

Este commit contém apenas o plano de desenvolvimento. Branding, tradução e implantação ainda não foram implementados nem testados.
Não conectar esta branch automaticamente ao ForgeNox em produção. A integração Railway será uma etapa posterior em ambiente separado, sem reutilizar credenciais de produção.
Não inserir segredos no repositório: este fork é público.

## Licença e atribuições

Preservar integralmente o arquivo LICENSE, o copyright `Copyright (c) 2026 Octop`, o texto da licença MIT e os demais avisos de terceiros nos arquivos e distribuições. A marca ForgeNox identifica a adaptação; não remove a autoria original nem implica endosso da TencentCloud.
