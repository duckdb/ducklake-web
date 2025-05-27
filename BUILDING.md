# Building Guide

To install the dependencies, follow the [Jekyll on macOS guide](https://jekyllrb.com/docs/installation/macos/), which recommends the Ruby version manager called `chruby`:

```bash
brew install chruby ruby-install
ruby-install ruby 3.4.1
```

Configure, e.g., put these lines in your `~/.zshrc`:

```bash
source /opt/homebrew/opt/chruby/share/chruby/chruby.sh
source /opt/homebrew/opt/chruby/share/chruby/auto.sh
chruby ruby-3.4.1
bundle install
```

Serve:

```bash
scripts/serve.sh
```
