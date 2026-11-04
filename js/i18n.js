/* Mini Télé — every interface string lives here. */
(function (global) {
  var DICT = {
    fr: {
      kidSubtitle: "Tes dessins animés",
      langGroup: "Langue",
      dpadHint: "Flèches : choisir   ·   OK : regarder   ·   Retour : quitter la vidéo",
      back: "Retour",
      pause: "Pause",
      play: "Lecture",
      loading: "Chargement…",
      empty: "Aucune vidéo pour le moment.",
      loadError: "Impossible de charger les vidéos.",
      embedError: "Cette vidéo ne peut pas être lue ici.",
      playerError: "La vidéo ne démarre pas.",
      offline: "Pas de connexion.",
      adminTitle: "Mini Télé",
      adminSubtitle: "Choisis les vidéos",
      passwordLabel: "Mot de passe",
      login: "Entrer",
      loginError: "Mot de passe incorrect.",
      logout: "Quitter",
      defaultPasswordWarning: "Le mot de passe est encore celui d'origine (minitele). Change-le dans Réglages.",
      tokenTitle: "Jeton GitHub",
      tokenHelp: "Colle un jeton fine-grained (contenu : lecture et écriture, seulement ce dépôt). Il reste sur cet appareil.",
      tokenPlaceholder: "github_pat_…",
      tokenSave: "Enregistrer sur cet appareil",
      tokenForget: "Oublier le jeton",
      tokenSaved: "Jeton enregistré sur cet appareil.",
      tokenMissing: "Ajoute le jeton GitHub avant d'enregistrer.",
      tokenTest: "Tester le jeton",
      tokenOk: "Le jeton peut écrire dans le dépôt.",
      tokenBad: "Le jeton a été refusé.",
      unsaved: "Modifications non enregistrées.",
      saveVideos: "Enregistrer les vidéos",
      saveChannels: "Enregistrer les chaînes",
      saved: "Enregistré sur GitHub.",
      saveError: "Échec de l'enregistrement.",
      conflict: "Quelqu'un a modifié le fichier. Recharge la page et réessaie.",
      saveHint: "Après l'enregistrement, la page de l'enfant se met à jour en une ou deux minutes.",
      tabApproved: "Approuvées",
      tabAdd: "Ajouter un lien",
      tabBrowse: "Chaînes",
      tabChannels: "Sources",
      tabSettings: "Réglages",
      starterBadge: "Kit de départ",
      removeStarter: "Retirer le kit de départ",
      moveUp: "Monter",
      moveDown: "Descendre",
      remove: "Retirer",
      confirmRemove: "Confirmer",
      addUrlLabel: "Lien d'une vidéo YouTube",
      addUrlPlaceholder: "https://www.youtube.com/watch?v=…",
      lookup: "Chercher",
      approve: "Approuver",
      alreadyApproved: "Déjà approuvée",
      embedOk: "La lecture intégrée est autorisée.",
      embedDisabled: "Cette vidéo n'autorise pas la lecture intégrée. Elle ne marchera pas sur la page enfant.",
      embedCheckFailed: "Impossible de vérifier la lecture intégrée. Elle est peut-être interdite.",
      lookupError: "Vidéo introuvable.",
      badUrl: "Lien non reconnu.",
      shortWarning: "Ceci ressemble à un Short.",
      durationUnknown: "durée inconnue",
      hideShorts: "Masquer les Shorts",
      hideLong: "Masquer les longues compilations",
      hideLive: "Masquer les directs",
      noFeeds: "Pas encore de flux. Lance le workflow « Update channel feeds » sur GitHub, ou attends la mise à jour quotidienne.",
      feedsUpdated: "Flux du",
      feedError: "Flux indisponible",
      channelAdd: "Ajouter une chaîne",
      channelName: "Nom",
      channelShort: "Nom court",
      channelId: "Identifiant de chaîne",
      channelUrl: "Adresse de la chaîne",
      channelEmoji: "Icône",
      channelRemove: "Retirer la chaîne",
      channelIdInvalid: "L'identifiant doit commencer par UC et faire 24 caractères.",
      channelDuplicate: "Cette chaîne est déjà dans la liste.",
      newPassword: "Nouveau mot de passe",
      confirmPassword: "Confirme le mot de passe",
      changePassword: "Changer le mot de passe",
      passwordMismatch: "Les deux mots de passe sont différents.",
      passwordShort: "Au moins 6 caractères.",
      passwordChanged: "Mot de passe changé. Il est enregistré dans le dépôt.",
      needToken: "Le jeton GitHub est nécessaire pour enregistrer.",
      category_dessins_animes: "Dessins animés",
      category_comptines_musique: "Comptines",
      category_educatif: "Éducatif",
      categoryLabel: "Catégorie",
      videosCount: "vidéos",
      filterEmpty: "Rien à montrer avec ces filtres.",
      settingsIntro: "Le mot de passe et le jeton protègent seulement l'accès depuis cet appareil. Lis le README : ce n'est pas un verrou de serveur.",
      repoLabel: "Dépôt",
      revisionLabel: "Version des vidéos",
      badgeShort: "Short",
      badgeLong: "Compilation",
      badgeLive: "Direct",
      emptyApproved: "Aucune vidéo approuvée.",
      addedLocal: "Ajoutée en bas de la liste. Enregistre pour la publier.",
      removedLocal: "Retirée de la liste. Enregistre pour publier.",
      testVideoTitle: "Aperçu"
    },
    "pt-BR": {
      kidSubtitle: "Seus desenhos",
      langGroup: "Idioma",
      dpadHint: "Setas: escolher   ·   OK: assistir   ·   Voltar: sair do vídeo",
      back: "Voltar",
      pause: "Pausa",
      play: "Assistir",
      loading: "Carregando…",
      empty: "Nenhum vídeo por enquanto.",
      loadError: "Não foi possível carregar os vídeos.",
      embedError: "Este vídeo não pode ser reproduzido aqui.",
      playerError: "O vídeo não começa.",
      offline: "Sem conexão.",
      adminTitle: "Mini Télé",
      adminSubtitle: "Escolha os vídeos",
      passwordLabel: "Senha",
      login: "Entrar",
      loginError: "Senha incorreta.",
      logout: "Sair",
      defaultPasswordWarning: "A senha ainda é a inicial (minitele). Troque em Ajustes.",
      tokenTitle: "Token do GitHub",
      tokenHelp: "Cole um token fine-grained (Contents: leitura e escrita, só neste repositório). Ele fica neste aparelho.",
      tokenPlaceholder: "github_pat_…",
      tokenSave: "Salvar neste aparelho",
      tokenForget: "Esquecer o token",
      tokenSaved: "Token salvo neste aparelho.",
      tokenMissing: "Adicione o token do GitHub antes de salvar.",
      tokenTest: "Testar o token",
      tokenOk: "O token consegue gravar neste repositório.",
      tokenBad: "O token foi recusado.",
      unsaved: "Alterações não salvas.",
      saveVideos: "Salvar os vídeos",
      saveChannels: "Salvar os canais",
      saved: "Salvo no GitHub.",
      saveError: "Não foi possível salvar.",
      conflict: "Alguém alterou o arquivo. Recarregue a página e tente de novo.",
      saveHint: "Depois de salvar, a página da criança atualiza em um ou dois minutos.",
      tabApproved: "Aprovados",
      tabAdd: "Colar um link",
      tabBrowse: "Canais",
      tabChannels: "Fontes",
      tabSettings: "Ajustes",
      starterBadge: "Kit inicial",
      removeStarter: "Tirar o kit inicial",
      moveUp: "Subir",
      moveDown: "Descer",
      remove: "Tirar",
      confirmRemove: "Confirmar",
      addUrlLabel: "Link de um vídeo do YouTube",
      addUrlPlaceholder: "https://www.youtube.com/watch?v=…",
      lookup: "Buscar",
      approve: "Aprovar",
      alreadyApproved: "Já aprovado",
      embedOk: "A reprodução incorporada é permitida.",
      embedDisabled: "Este vídeo não permite reprodução incorporada. Ele não vai funcionar na página da criança.",
      embedCheckFailed: "Não foi possível verificar a reprodução incorporada. Ela pode estar bloqueada.",
      lookupError: "Vídeo não encontrado.",
      badUrl: "Link não reconhecido.",
      shortWarning: "Isto parece um Short.",
      durationUnknown: "duração desconhecida",
      hideShorts: "Ocultar Shorts",
      hideLong: "Ocultar compilações longas",
      hideLive: "Ocultar ao vivo",
      noFeeds: "Ainda não há feeds. Rode o workflow « Update channel feeds » no GitHub, ou espere a atualização diária.",
      feedsUpdated: "Feed de",
      feedError: "Feed indisponível",
      channelAdd: "Adicionar um canal",
      channelName: "Nome",
      channelShort: "Nome curto",
      channelId: "ID do canal",
      channelUrl: "Endereço do canal",
      channelEmoji: "Ícone",
      channelRemove: "Tirar o canal",
      channelIdInvalid: "O ID deve começar com UC e ter 24 caracteres.",
      channelDuplicate: "Este canal já está na lista.",
      newPassword: "Nova senha",
      confirmPassword: "Confirme a senha",
      changePassword: "Trocar a senha",
      passwordMismatch: "As duas senhas são diferentes.",
      passwordShort: "Pelo menos 6 caracteres.",
      passwordChanged: "Senha alterada. Ela foi salva no repositório.",
      needToken: "O token do GitHub é necessário para salvar.",
      category_dessins_animes: "Desenhos",
      category_comptines_musique: "Cantigas",
      category_educatif: "Educativo",
      categoryLabel: "Categoria",
      videosCount: "vídeos",
      filterEmpty: "Nada para mostrar com estes filtros.",
      settingsIntro: "A senha e o token só protegem o acesso a partir deste aparelho. Leia o README: isto não é uma trava no servidor.",
      repoLabel: "Repositório",
      revisionLabel: "Versão dos vídeos",
      badgeShort: "Short",
      badgeLong: "Compilação",
      badgeLive: "Ao vivo",
      emptyApproved: "Nenhum vídeo aprovado.",
      addedLocal: "Adicionado no fim da lista. Salve para publicar.",
      removedLocal: "Tirado da lista. Salve para publicar.",
      testVideoTitle: "Prévia"
    }
  };

  var LANG_KEY = "minitele.lang";

  function getLang() {
    try {
      return localStorage.getItem(LANG_KEY) === "pt-BR" ? "pt-BR" : "fr";
    } catch (error) {
      return "fr";
    }
  }

  function setLang(lang) {
    var next = lang === "pt-BR" ? "pt-BR" : "fr";
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch (error) {
      /* private mode */
    }
    document.documentElement.lang = next;
  }

  function t(key) {
    var lang = getLang();
    var table = DICT[lang] || DICT.fr;
    if (table[key]) return table[key];
    return DICT.fr[key] || key;
  }

  function apply(root) {
    var scope = root || document;
    document.documentElement.lang = getLang();
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    scope.querySelectorAll("[data-lang]").forEach(function (el) {
      var on = el.getAttribute("data-lang") === getLang();
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.documentElement.classList.add("i18n-ready");
    if (typeof global.__miniteleOnLang === "function") global.__miniteleOnLang();
  }

  function toggle(lang) {
    setLang(lang || (getLang() === "fr" ? "pt-BR" : "fr"));
    apply();
  }

  global.I18N = { t: t, apply: apply, getLang: getLang, setLang: setLang, toggle: toggle, DICT: DICT };
  setLang(getLang());
})(window);
