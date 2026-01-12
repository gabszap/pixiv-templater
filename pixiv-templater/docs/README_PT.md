# Pixiv Templater

![License](https://img.shields.io/github/license/gabszap/pixiv-templater)
![Releases](https://img.shields.io/github/v/release/gabszap/pixiv-templater)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Firefox%20%7C%20Brave-lightgrey)

<p align="left">
  <a href="../../README.md"><img src="https://img.shields.io/badge/Language-English-blue?style=flat-square" alt="English"></a>
  <a href="README_PT.md"><img src="https://img.shields.io/badge/Idioma-Português-green?style=flat-square" alt="Português"></a>
  <a href="README_JP.md"><img src="https://img.shields.io/badge/言語-日本語-red?style=flat-square" alt="日本語"></a>
  <a href="README_ZH-CN.md"><img src="https://img.shields.io/badge/语言-简体中文-orange?style=flat-square" alt="简体中文"></a>
</p>

Uma extensão de navegador para automatizar o processo de upload de ilustrações no Pixiv. Salve templates com título, descrição, tags e configurações, e aplique-os com um clique. Também traduz automaticamente tags japonesas para tags do Danbooru.

## 📌 Sumário
- [Sobre o Projeto](#sobre-o-projeto)
- [Por que criei isso?](#por-que-criei-isso)
- [Showcase](#showcase)
- [Recursos](#recursos)
- [Instalação](#instalação)
- [Atalhos de Teclado](#atalhos-de-teclado)

## Sobre o Projeto

O Pixiv Templater foi criado para artistas que postam frequentemente no Pixiv e precisam preencher as mesmas informações repetidamente. Em vez de digitar manualmente ou copiar/colar de outro lugar, você pode salvar templates e aplicá-los instantaneamente.

A funcionalidade de tradução de tags foi integrada do userscript [translate-pixiv-tags](https://github.com/evazion/translate-pixiv-tags), permitindo que você veja a tradução das tags japonesas recomendadas pelo Pixiv para seus equivalentes no Danbooru.

## Por que criei isso?

A ideia surgiu da minha própria frustração com o processo de upload no Pixiv. Como o site não oferece templates, eu era obrigado a manter minhas descrições fixadas na área de transferência do Windows e colar manualmente em cada post. Somado a isso, perder tempo pesquisando o significado de cada tag sugerida em japonês tornava o processo muito cansativo. Decidi criar esta extensão para transformar esse trabalho manual em algo de um clique, focando no que realmente importa: postar a arte e seguir em frente.

## Showcase

| Dashboard | Painel | Tradução de Tags |
|:---------:|:------:|:----------------:|
| <img src="../assets/dashboard.png" width="400"/> | <img src="../assets/painel.png" width="300"/> | <img src="../assets/translated-tags.png" width="400"/> |
| Gerencie seus templates. | Use direto no upload. | Tags traduzidas. |

## Recursos

### Templates
- 📝 Salve templates com título, descrição (caption), tags, classificação etária e status de geração por IA
- 🔄 Aplique templates com um clique ou atalho de teclado
- ✏️ Edite e exclua templates existentes
- 📤 Exporte e importe templates em JSON
- 🔢 Suporte para até 9 templates com atalhos rápidos

### Tradução de Tags
- 🏷️ Traduz automaticamente tags japonesas da pagina de upload para tags do Danbooru
- 🎨 Cores por categoria (artista, personagem, copyright, geral, meta)

### Interface
- 🖱️ Painel arrastável e redimensionável
- 🌙 Suporte a modo escuro (dark mode)
- ⌨️ Atalhos de teclado personalizáveis
- 📊 Estatísticas de uso de templates
- 👁️ Preview de templates antes de aplicar

## Instalação

### Firefox / baseados em Firefox

1. Baixe o arquivo `.xpi` mais recente em [Releases](https://github.com/gabszap/pixiv-templater/releases)
2. Abra o Firefox e vá para `about:addons`
3. Clique no ícone de engrenagem ⚙️ → "Instalar de um arquivo..."
4. Selecione o arquivo `.xpi` baixado

### Chrome / Edge / Brave / baseados em Chromium

1. Baixe e extraia o zip da [última release](https://github.com/gabszap/pixiv-templater/releases)
2. Abra `chrome://extensions` (ou equivalente no seu navegador)
3. Ative o "Modo de desenvolvedor" no canto superior direito
4. Clique em "Carregar sem compactação"
5. Selecione a pasta `pixiv-templater`

## Uso

> [!IMPORTANT]
> **Bug conhecido:** Se a extensão não iniciar automaticamente ao navegar pelo menu do Pixiv, basta clicar no ícone dela na barra de ferramentas para ativar. Estamos trabalhando em uma correção!

1. Vá para a página de upload do Pixiv (`pixiv.net/illustration/create`)
2. O painel de Templates aparecerá no canto superior direito
3. Clique em um template para aplicá-lo, ou crie o seu próprio

### Criando um Template

1. Clique em "Novo Template"
2. Preencha os campos desejados:
   - **Nome** - Identificador do template
   - **Título** - Título da ilustração (titulo que vai pro pixiv)
   - **Descrição** - Texto da descrição/caption
   - **Tags** - Lista de tags separadas por espaço ou Enter
   - **Classificação** - All ages, R-18 ou R-18G
   - **Gerado por IA** - Marque se a ilustração foi gerada por IA
3. Clique em "Salvar"

### Legenda das cores

Cada cor representa uma categoria de tags:

| Cor | Categoria | Exemplos |
|-----|-----------|----------|
| 🔵 Azul | Geral | thighs, bikini, large_breasts |
| 🔴 Vermelho | Artista | nome do artista no Danbooru |
| 🟣 Roxo | Copyright/Franquia | genshin_impact, honkai:_star_rail |
| 🟢 Verde | Personagem | kafka_(honkai:_star_rail), hu_tao |
| 🟠 Laranja | Meta | ai-generated, highres, absurdres |

## Atalhos de Teclado

| Ação | Atalho Padrão |
|------|---------------|
| Abrir/Fechar Painel | `Ctrl+Shift+T` |
| Minimizar Painel | `Ctrl+Shift+M` |
| Novo Template | `Ctrl+Shift+N` |
| Exportar Templates | `Ctrl+Shift+E` |
| Importar Templates | `Ctrl+Shift+I` |
| Ajuda | `Ctrl+Shift+H` |
| Aplicar Template 1-9 | `Ctrl+1` a `Ctrl+9` |

Os atalhos podem ser personalizados nas configurações da extensão.

## Bugs Conhecidos

| Bug | Descrição | Workaround |
|-----|-----------|------------|
| Extensão não inicia automaticamente | Ao navegar pelo menu do Pixiv (Post → Illustrations) para a página de upload, a extensão pode não aparecer automaticamente | Clique no ícone da extensão na barra de ferramentas para ativá-la |

## Créditos

- Tradução de tags baseada no [translate-pixiv-tags](https://github.com/evazion/translate-pixiv-tags) por evazion
- API de tags: [Danbooru](https://danbooru.donmai.us)

## Contribuição

Contribuições são o que tornam a comunidade open source um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

1. Faça um **Fork** do projeto
2. Crie uma **Branch** para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Faça o **Commit** de suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Faça o **Push** para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

Se você encontrar um bug ou tiver uma sugestão, sinta-se à vontade para abrir uma [Issue](https://github.com/gabszap/pixiv-templater/issues).

Quer adicionar traduções para outro idioma? Sinta-se à vontade para enviar um Pull Request.

## Licença

MIT License - veja [LICENSE](LICENSE)
