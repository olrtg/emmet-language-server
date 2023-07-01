<!-- markdownlint-disable MD033 MD041 -->
<div align="center">
    <img src="./assets/logo.svg">
    <h3>emmet-ls</h3>
    <p>A language server for <a href="https://emmet.io/" target="_blank">emmet.io</a></p>
</div>

---

### Why another language server?

While [aca/emmet-ls](https://github.com/aca/emmet-ls) works for what I need, there were a couple of things that annoyed me from time to time and while trying to fix one of those things (aca/emmet-ls#55) I've discovered that we can leverage [microsoft/vscode-emmet-helper](https://github.com/microsoft/vscode-emmet-helper) and make a simple language server that wraps that package to provide completions.

So I decided to do that and it worked!

The most important thing is that [microsoft/vscode](https://github.com/microsoft/vscode) has an excelent integration with emmet and we can have that, in all editors that implement the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/).

### Setup

First install:

```sh
npm i -g @olrtg/emmet-ls
```

#### Neovim (withouth nvim-lspconfig)

```lua
vim.api.nvim_create_autocmd({ "FileType" }, {
  pattern = "astro,css,eruby,html,htmldjango,javascriptreact,less,pug,sass,scss,svelte,typescriptreact,vue",
  callback = function()
    vim.lsp.start({
      cmd = { "emmet-ls", "--stdio" },
      root_dir = vim.fs.dirname(vim.fs.find({ ".git" }, { upward = true })[1]),
      -- More info at https://code.visualstudio.com/docs/editor/emmet#_emmet-configuration
      init_options = {
        --- @type table<string, any> https://docs.emmet.io/customization/preferences/
        preferences = {},
        --- @type "always" | "never" Defaults to `"always"`
        showExpandedAbbreviation = "always",
        --- @type boolean Defaults to `true`
        showAbbreviationSuggestions = true,
        --- @type boolean Defaults to `false`
        showSuggestionsAsSnippets = false,
        --- @type table<string, any> https://docs.emmet.io/customization/syntax-profiles/
        syntaxProfiles = {},
        --- @type table<string, string> https://docs.emmet.io/customization/snippets/#variables
        variables = {},
        --- @type string[]
        excludeLanguages = {},
      },
    })
  end,
})
```

### Credits

- [@aca](https://github.com/aca) for the first language server ([aca/emmet-ls](https://github.com/aca/emmet-ls))
- [@wassimk](https://github.com/wassimk) for bringing the [microsoft/vscode-emmet-helper](https://github.com/microsoft/vscode-emmet-helper) repo to my attention in aca/emmet-ls#55
- [microsoft/vscode](https://github.com/microsoft/vscode) for having such an amazing integration with emmet and the easy and open package to integrate with
- [emmetio/emmet](https://github.com/emmetio/emmet) for the awesome tool
