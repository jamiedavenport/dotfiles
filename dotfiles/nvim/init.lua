-- Neovim configuration.
--
-- Week 1: built-in features only, no plugins. Add features as you learn them,
-- and read `:help '<option>'` for anything below.

vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

-- Appearance: Neovim's default colorscheme in its light variant.
vim.o.background = 'light'
vim.o.termguicolors = true
vim.o.number = true
vim.o.relativenumber = true
vim.o.signcolumn = 'yes'
vim.o.cursorline = true
vim.o.scrolloff = 8
vim.o.wrap = false
vim.o.list = true
vim.opt.listchars = { tab = '» ', trail = '·', nbsp = '␣' }

-- Editing
vim.o.expandtab = true
vim.o.shiftwidth = 2
vim.o.tabstop = 2
vim.o.smartindent = true
vim.o.undofile = true
vim.o.confirm = true
vim.o.clipboard = 'unnamedplus'

-- Search
vim.o.ignorecase = true
vim.o.smartcase = true
vim.o.inccommand = 'split'

-- Splits
vim.o.splitright = true
vim.o.splitbelow = true
vim.o.updatetime = 250

-- Clear search highlighting with Esc.
vim.keymap.set('n', '<Esc>', '<cmd>nohlsearch<CR>')

-- Briefly highlight yanked text.
vim.api.nvim_create_autocmd('TextYankPost', {
  callback = function()
    vim.hl.on_yank()
  end,
})
