# Português do Brasil e inglês

O painel aceita `pt-BR` e `en`, mantendo compatibilidade com `zh` da base original.
O seletor de idioma está no login e nas configurações da conta. O navegador em
português usa PT-BR no primeiro acesso; uma preferência salva tem prioridade.
A preferência do usuário é persistida no servidor e restaurada no próximo login.

O catálogo estático PT-BR cobre as chaves do painel e do servidor. As mensagens
de erro e os nomes de ferramentas usam o mesmo texto canônico, com adaptação de
`{name}` do Python para `{{name}}` do i18next. Comandos executáveis, links e
marcadores de interpolação são preservados. Ant Design e Day.js usam PT-BR.

O inglês continua disponível como idioma selecionável e fallback. Nomes próprios,
modelos de especialistas, prompts, conteúdo de usuários e catálogos de terceiros
podem manter o idioma original; não são reescritos ao mudar o idioma do painel.
Voz e provedores externos continuam sujeitos aos idiomas suportados por cada serviço.

Os textos PT-BR foram inicialmente gerados localmente com o modelo inglês–português
brasileiro do Argos/OPUS-MT, com revisão dos fluxos de login, cadastro, conta,
navegação, especialistas e erros principais. Textos técnicos menos usados ainda
podem precisar de ajustes de terminologia. Nenhum modelo de tradução ou dependência
de tradução é incluído no runtime.

Referências do processo de tradução:

- https://github.com/argosopentech/argospm-index
- https://data.argosopentech.com/argospm/v1/translate-en_pb-1_9.argosmodel
- Jörg Tiedemann e Santhosh Thottingal, “OPUS-MT — Building open translation services for the World”, EAMT 2020.

A licença MIT e os avisos originais do Octop permanecem intactos.
