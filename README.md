# Mini Télé

Mini Télé é um site estático para uma criança de 4 anos assistir **somente** aos vídeos do YouTube que o pai aprovou. Não tem busca, comentários, recomendação nem link para sair para o YouTube.

A página da criança fica em tela cheia, com cartões grandes. O controle remoto da Android TV (setas, OK e Voltar) e o toque no celular funcionam. Dá para instalar no celular como aplicativo e, na TV, com um APK.

A interface inteira está em francês. Um botão **FR / PT** no canto muda para português do Brasil e lembra a escolha neste aparelho.

## Endereços

Depois que o GitHub Pages estiver ativo:

- Página da criança: <https://allefs17fr-ai.github.io/mini-tele/>
- Página do pai (não aparece na página da criança): <https://allefs17fr-ai.github.io/mini-tele/admin.html>
- APK (telefone e Android TV): <https://github.com/allefs17fr-ai/mini-tele/releases/tag/android-apk>

O APK também fica como arquivo do workflow **Build Android APK** (artifact `mini-tele-apk`), se a Release ainda não tiver sido criada.

## O que você precisa fazer à mão

O código deste repositório não liga o Pages sozinho na primeira vez, e não pode criar o token no seu lugar.

1. Junte este trabalho na branch `main` (se ainda estiver num pull request, clique em **Merge**).
2. Ative o GitHub Pages (passo a passo abaixo).
3. Espere o workflow **Deploy GitHub Pages** ficar verde.
4. Abra a página do pai e entre com a senha inicial `minitele`.
5. Crie um token fine-grained e cole na página do pai, **neste aparelho**.
6. Troque a senha.
7. Aprove ou tire vídeos e clique em **Salvar os vídeos**.
8. No celular, instale o site na tela inicial.
9. Na TV, instale o APK.

## 1. Ativar o GitHub Pages

1. Abra este repositório no GitHub.
2. **Settings** → **Pages**.
3. Em **Build and deployment**, escolha **Source: GitHub Actions**.
4. Abra a aba **Actions** e confira o workflow **Deploy GitHub Pages**.
5. Se ele não tiver rodado, clique no workflow e em **Run workflow**.

O repositório precisa estar **público** para o Pages gratuito. O primeiro deploy leva um ou dois minutos. Quando terminar, o endereço da criança abre no navegador.

Cada vez que a página do pai salva um vídeo, o site se atualiza sozinho em mais um ou dois minutos.

## 2. Senha da página do pai

A senha inicial é:

```text
minitele
```

Troque assim que o token estiver salvo:

1. Abra <https://allefs17fr-ai.github.io/mini-tele/admin.html>
2. Entre com `minitele`.
3. Aba **Réglages** / **Ajustes** (mude o idioma no botão PT se quiser).
4. Preencha a senha nova duas vezes (mínimo de 6 caracteres) e clique em **Changer le mot de passe** / **Trocar a senha**.

A senha nova é gravada em `data/config.json` no GitHub. Não existe servidor: o navegador só compara um hash SHA-256. Qualquer pessoa que leia o repositório pode tentar adivinhar uma senha fraca. Use uma senha que você não usa em outro lugar, longa o bastante para a criança não acertar, e trate isto como uma trava de gaveta, não como um banco.

Se um dia a página do pai não abrir e você precisar repor a senha no arquivo, no computador:

```bash
python3 -c "import hashlib; print(hashlib.sha256('sua-senha-nova'.encode()).hexdigest())"
```

Cole o resultado no campo `passwordSha256` de `data/config.json` e faça commit na branch `main`.

## 3. Criar o token do GitHub

A página do pai grava os vídeos aprovados direto no GitHub. Para isso ela precisa de um token **seu**, colado uma vez. O token fica só no `localStorage` daquele navegador. Ele não entra no repositório. Não cole o token em issue, chat ou README.

1. No GitHub, clique na sua foto → **Settings**.
2. No fim do menu: **Developer settings**.
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
4. Nome: `mini-tele`.
5. Validade: a mais longa que o GitHub oferecer (em geral 1 ano). Anote o dia em que expira.
6. **Resource owner**: a sua conta.
7. **Repository access**: **Only select repositories** → `mini-tele`.
8. **Permissions** → **Repository permissions** → **Contents**: **Read and write**.
9. Não marque mais nenhuma permissão.
10. **Generate token** e copie o valor (começa com `github_pat_`).
11. Na página do pai, aba **Réglages**, cole no campo do token e clique em **Enregistrer sur cet appareil** / **Salvar neste aparelho**.
12. Clique em **Tester le jeton** / **Testar o token**. Deve aparecer que o token consegue gravar.

Se você limpar os dados do navegador, cole o token de novo. Se o token expirar, gere outro e cole no lugar. O botão **Oublier le jeton** apaga o token só deste aparelho.

## 4. Aprovar vídeos

A página da criança já abre com um **kit de partida**: episódios calmos de T'choupi, Petit Ours Brun, Trotro e Bing. Eles estão marcados como kit de partida. Pode tirar todos de uma vez com **Retirer le kit de départ** / **Tirar o kit inicial**, ou tirar um por um.

Para publicar qualquer mudança, clique em **Enregistrer les vidéos** / **Salvar os vídeos**. Sem o token, o botão avisa e não grava.

Três jeitos de acrescentar:

- **Colar um link.** Aceita `youtube.com/watch?v=…`, `youtu.be/…`, `shorts` e `embed`. O site pede o título ao YouTube (oEmbed) e avisa se o vídeo **não deixa** ser reproduzido dentro de outra página. Se não deixar, ele não toca na página da criança.
- **Olhar os canais.** A aba **Chaînes** / **Canais** mostra os vídeos recentes do arquivo `data/feeds.json`. Shorts, compilações longas e diretos vêm ocultos (dá para mostrar de novo com as caixas). A duração aparece quando o feed a conhece. O RSS público do YouTube quase nunca manda a duração; o filtro de compilação usa o título (`compilation`, `1 heure`, `30 min`, `5x épisodes`, etc.).
- **Subir / descer** muda a ordem dos cartões.

### Canais de origem

Os 12 canais estão em `data/channels.json`. Na aba **Sources** / **Fontes** dá para acrescentar ou tirar. Salve com **Enregistrer les chaînes** / **Salvar os canais**.

O canal `@TchoupiOfficiel` da lista original não tem nenhum vídeo público. Os episódios oficiais estão em [@tchoupi](https://www.youtube.com/@tchoupi) (`UC5hqGTWVyQQSpsh-5pyFo8Q`). Foi esse canal que entrou no lugar. No dia em que os feeds foram gerados, **Le monde des Titounis** e **Lumni** também responderam com o feed vazio (a cadeia existe, mas o RSS público não listou vídeos). Para esses dois, cole o link do episódio na mão.

O workflow **Update channel feeds** baixa o RSS público de cada canal (`https://www.youtube.com/feeds/videos.xml?channel_id=…`) todo dia às 05:15 UTC, e também quando você clica em **Run workflow**. Não precisa de chave da API do YouTube. Com o token salvo, a aba de canais lê a versão mais nova direto do GitHub.

## 5. Instalar no celular

1. No Chrome do Android, abra <https://allefs17fr-ai.github.io/mini-tele/>.
2. Menu do Chrome (três pontos) → **Adicionar à tela inicial** ou **Instalar app**.
3. Confirme. O ícone **Mini Télé** abre em tela cheia, só com os vídeos aprovados.

O site é uma PWA: tem manifesto e service worker. Os cartões continuam visíveis sem rede se já tiverem sido abertos; o vídeo em si precisa de internet.

## 6. Instalar o APK na Android TV

O APK é uma janela WebView em tela cheia que abre o site. Serve no celular e na TV. Na TV ele aparece na fileira de aplicativos (banner e categoria `LEANBACK_LAUNCHER`). A tela de toque não é obrigatória. As setas do controle movem o foco (anel amarelo), OK assiste, Voltar sai do vídeo e volta para a grade. Se já estiver na grade, Voltar fecha o aplicativo.

O arquivo está assinado com a chave `android/keystore/minitele-debug.keystore` (senha `minitele`, alias `minitele`), de propósito, para uma atualização instalar por cima da anterior. Não é uma chave da Play Store. Instale só o APK publicado nas Releases **deste** repositório.

### Pelo app Downloader (o caminho mais simples na TV)

1. No computador, abra a Release e confirme que `mini-tele.apk` está lá. Se o workflow ainda não rodou na `main`, abra **Actions** → **Build Android APK** → **Run workflow** e espere o arquivo.
2. Na TV, instale o aplicativo **Downloader** pela Play Store.
3. Em **Configurações → Segurança** (ou **Apps**), permita que o Downloader instale aplicativos de fontes desconhecidas.
4. Abra o Downloader e digite o endereço curto da Release, ou baixe o APK no computador e suba num lugar que a TV alcance.
5. Abra o arquivo `mini-tele.apk` e confirme **Instalar**.
6. Abra **Mini Télé** na lista de apps. A TV precisa de internet.

### Por pen drive

1. Baixe `mini-tele.apk` no computador.
2. Copie para um pen drive.
3. Ligue o pen drive na TV.
4. Com um gerenciador de arquivos, abra o APK e instale. Se a TV bloquear, ative **Fontes desconhecidas** para esse gerenciador.

Se uma atualização futura recusar instalar por causa da assinatura, desinstale o Mini Télé e instale de novo. O site em si atualiza sem trocar o APK: o aplicativo só mostra a página.

## Como o vídeo toca

O player é o YouTube IFrame no domínio `youtube-nocookie.com`, com `rel=0` e sem os controles nativos do YouTube. Uma camada cobre o vídeo inteiro e impede o toque no logo, no título e nas sugestões. Por cima dela ficam os nossos botões: pausa/play e uma barra para avançar ou voltar. No celular, toque na pausa e arraste a barra. Na TV, OK pausa, as setas chegam na barra e, com a barra selecionada, esquerda/direita pulam cerca de 10 segundos. O tempo já visto e a duração aparecem na barra. Os controles somem depois de alguns segundos e voltam com um toque ou qualquer tecla. Uns 3 segundos antes do fim, a página fecha o vídeo e volta para a grade. Não há link para abrir o YouTube.

## Segurança, em uma frase

Senha, token e lista de vídeos são tratados no navegador. Quem tem o token consegue alterar os arquivos `data/` deste repositório. Quem não tem o token só assiste ao que já foi publicado. Não commite token.

## Para quem mexe no código

O site não tem etapa de build. Os testes de navegador (grade, setas, idioma, admin com a API do GitHub simulada):

```bash
npm install
npm test
```

Os workflows são:

- **Deploy GitHub Pages** — publica o site a cada push na `main`.
- **Update channel feeds** — agenda diária e disparo manual; grava `data/feeds.json`.
- **Build Android APK** — gera `mini-tele.apk` e, na `main`, publica a Release `android-apk`.
