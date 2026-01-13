<p align="center">
  <img src="https://socialify.git.ci/gabszap/pixiv-templater/image?custom_description=Uma+extens%C3%A3o+de+navegador+que+automatiza+uploads+no+Pixiv+usando+templates+de+um+clique+para+t%C3%ADtulos%2C+tags+e+configura%C3%A7%C3%B5es.&description=1&font=Inter&logo=https%3A%2F%2Fgithub.com%2Fgabszap%2Fpixiv-templater%2Fraw%2Frefs%2Fheads%2Fmain%2Fpixiv-templater%2Fassets%2Ficons%2Ficon.svg&name=1&pattern=Solid&theme=Dark" alt="pixiv-templater">
</p>

<p align="center">
  <img src="https://img.shields.io/github/v/release/gabszap/pixiv-templater?style=for-the-badge" alt="Releases">
  <img src="https://img.shields.io/github/license/gabszap/pixiv-templater?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Criado_Com-Claude-orange?style=for-the-badge&logo=anthropic" alt="Criado com Claude">
  <img src="https://img.shields.io/github/last-commit/gabszap/pixiv-templater?style=for-the-badge&logo=github&logoColor=white&labelColor=black" alt="Last Commit">
  <img src="https://img.shields.io/github/stars/gabszap/pixiv-templater?style=for-the-badge&logo=github&color=yellow" alt="Stars">
</p>

<p align="center">
  <a href="../../README.md">English</a> | 
  <a href="README_PT.md">Português</a> | 
  <a href="README_JP.md">日本語</a> | 
  <a href="README_ZH-CN.md">中文</a>
</p>

---

Uma extensão de navegador para automatizar o processo de upload de ilustrações no Pixiv. Salve templates com título, descrição, tags e configurações, e aplique-os com um clique. Também traduz automaticamente tags japonesas para tags do Danbooru.

## 📌 Sumário
- [Sobre o Projeto](#sobre-o-projeto)
- [Por que criei isso?](#por-que-criei-isso)
- [Showcase](#showcase)
- [Recursos](#recursos)
- [Instalação](#instalação)
- [Atalhos de Teclado](#atalhos-de-teclado)

## Sobre o Projeto

O **Pixiv Templater** é uma extensão de navegador projetada para agilizar a rotina de artistas que postam frequentemente no Pixiv. Em vez de lidar com a entrada de dados manual e repetitiva ou depender de notas externas para copiar e colar, a ferramenta permite salvar templates completos e aplicá-los instantaneamente, garantindo velocidade e consistência em cada postagem.

## Por que criei isso?

A ideia surgiu da minha própria frustração com o processo de upload no Pixiv. Como o site não oferece templates, eu era obrigado a manter minhas descrições fixadas na área de transferência do Windows e colar manualmente em cada post. Somado a isso, perder tempo pesquisando o significado de cada tag sugerida em japonês tornava o processo muito cansativo. Decidi criar esta extensão para transformar esse trabalho manual em algo de um clique, focando no que realmente importa: postar a arte e seguir em frente.

## Showcase

<details>
  <summary>Clique para ver as capturas de tela</summary>

  ### Demonstração em Vídeo
  Veja a extensão em ação.

  ![Demo](../assets/demo.mp4)

  ### Dashboard
  Gerencie seus templates e configurações.
  ![Dashboard](../assets/dashboard.png)

  ### Painel
  Painel flutuante na página de upload.

  ![Panel](../assets/painel.png)

  ### Tradução de Tags
  Traduções automáticas de tags.

  ![Tag Translation](../assets/translated-tags.png)

</details>

## Recursos

### Templates
- 📝 Salve templates com título, descrição (caption), tags, classificação etária e status de geração por IA.
- 🔄 Aplique templates com um clique ou através de atalhos de teclado.
- 📂 Exporte e importe templates (JSON) para backup ou compartilhamento.

### Tradução de Tags
- 🏷️ Traduz automaticamente tags japonesas da página de upload para tags do Danbooru.
- 🎨 Cores por categoria (artista, personagem, copyright, geral, meta).

### Facilidade de Uso
- ⚡ Painel flutuante que pode ser minimizado.
- ⌨️ Atalhos de teclado totalmente personalizáveis.
- 🌙 Suporte nativo ao Modo Escuro.

## Instalação

### Firefox & Navegadores baseados em Firefox
1. Baixe o arquivo `.xpi` mais recente na página de [Releases](https://github.com/gabszap/pixiv-templater/releases).
2. Abra o Firefox e digite `about:addons` na barra de endereços.
3. Clique no ícone de engrenagem e selecione **"Instalar de um arquivo..."**.
4. Selecione o arquivo `.xpi` baixado.

### Chrome & Navegadores baseados em Chrome
1. Baixe o arquivo `.zip` na página de [Releases](https://github.com/gabszap/pixiv-templater/releases).
2. Vá para `chrome://extensions/`.
3. Ative o **"Modo do desenvolvedor"** no canto superior direito.
4. Clique em **"Carregar sem compactação"** e selecione a pasta do arquivo `.zip` baixado (após extrair).

> [!IMPORTANT]
> **Nota:** Atualmente, apenas o Firefox suporta atualizações automáticas. Para navegadores baseados em Chromium, as atualizações automáticas ainda não estão disponíveis para instalações manuais. Verifique a página de [Releases](https://github.com/gabszap/pixiv-templater/releases) periodicamente para garantir que você tenha a versão mais recente.

## Atalhos de Teclado

| Ação | Atalho Padrão |
|------|---------------|
| Abrir/Fechar Painel | `Alt+Shift+T` |
| Minimizar Painel | `Alt+Shift+M` |
| Novo Template | `Alt+Shift+N` |
| Aplicar Template 1-9 | `Alt+1` a `Alt+9` |

## Contribuição

Qualquer contribuição é muito apreciada.

1. Faça um **Fork** do projeto
2. Crie uma **Branch** para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Faça o **Commit** de suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Faça o **Push** para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

Se você encontrar um bug ou tiver uma sugestão, sinta-se à vontade para abrir uma [Issue](https://github.com/gabszap/pixiv-templater/issues).

Quer adicionar traduções para outro idioma? Sinta-se à vontade para enviar um Pull Request.

<details>
  <summary>Como adicionar novos idiomas</summary>
Se você quiser contribuir adicionando um novo idioma à extensão, siga estas etapas rápidas:

1. **Crie o arquivo de locale**: Vá para `pixiv-templater/locales/` e crie um novo arquivo JSON nomeado com o [código do idioma](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales) (ex: `fr.json` para Francês). Você pode usar `en.json` como base.
2. **Registre o idioma**: Abra `pixiv-templater/locales/languages.json` e adicione o código do seu idioma e o nome de exibição à lista:
   ```json
   "fr": "Français"
   ```
3. **Traduza**: Preencha o novo arquivo JSON com as strings traduzidas.

Isso é tudo! A extensão detectará automaticamente o novo idioma e o mostrará no menu de configurações. Sinta-se à vontade para enviar um Pull Request com sua tradução!

</details>

## Créditos

- Tradução de tags baseada no [translate-pixiv-tags](https://github.com/evazion/translate-pixiv-tags) por evazion.
- API de tags: [Danbooru](https://danbooru.donmai.us).

## Licença

MIT License - veja [LICENSE](../../LICENSE)
