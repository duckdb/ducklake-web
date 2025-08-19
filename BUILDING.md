# Building Guide

To install the dependencies, follow the [Jekyll on macOS guide](https://jekyllrb.com/docs/installation/macos/), which recommends the Ruby version manager called `chruby`:

```bash
brew install chruby ruby-install
ruby-install ruby 3.4.5
```

Configure your shell to use `chruby`, e.g., put these lines in your `~/.zshrc`:

```bash
source /opt/homebrew/opt/chruby/share/chruby/chruby.sh
source /opt/homebrew/opt/chruby/share/chruby/auto.sh
```

Install Jekyll and the other required Ruby dependencies using Bundler:

```bash
bundle install
```

Serve:

```bash
scripts/serve.sh
```
