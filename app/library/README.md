# Default library and profile

The installed app opens with the **CocoLoop Default Studio** profile. Everything here is local, versioned and editable.

## Layout

```text
app/library/
  profile.json              profile index and all pattern/preset/plugin/agent items
  templates/
    trap-starter.json       complete 8-bar project
    house-starter.json
    lofi-starter.json
```

## Profile schema

`profile.json` uses `schema: "cocoloop.profile"` and version 1:

| Field | Meaning |
|---|---|
| `id`, `name`, `description` | identity shown in the Library view |
| `defaultProject` | template recommended for a fresh session |
| `appearance` | accent and theme metadata |
| `sections` | ordered, hierarchical groups: templates, patterns, presets, plugins, agents |

Each section has `id`, `title`, `icon`, `description` and `items`. An item has `id`, `name`, `description` and one of:

- `file` for a template JSON loaded as a project;
- `actions` for an array of documented agent actions;
- `command` for an agent profile copied to the clipboard.

## Track-role placeholders

Patterns and plugins use placeholder track IDs that the UI resolves at click time:

| Placeholder | Resolves to |
|---|---|
| `$selected` | current selected track |
| `$kick`, `$snare`, `$hat`, `$clap`, `$perc` | first drum track with that instrument |
| `$bass`, `$keys`, `$lead`, `$pad`, `$sampler` | first synth or sampler track with that instrument |

If a role is missing, that action is skipped. If no actions remain, the Library shows an error instead of applying a partial edit.

## Built-in plugins

| Plugin | Effect |
|---|---|
| Four on the Floor | Kick on quarters, tighter level and filter |
| Humanize Hats | Ghost-note pattern and lower hat level |
| Chord Stack | Two-chord progression in the keys track |
| Balance Mix | Role-based levels and master volume |
| Lo-fi Dust | Darker keys/bass/hats, delay and softer master |

Every plugin becomes one undo step. None of them calls the network or the file system.

## Adding items

1. Add a template under `templates/` or an item under the appropriate section in `profile.json`.
2. Use only documented actions from `docs/AGENT-API.md`.
3. Keep values bounded and names under the documented limits.
4. Open **Library** and click the item; no rebuild is needed.
