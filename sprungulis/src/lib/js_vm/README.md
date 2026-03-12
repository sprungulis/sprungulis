## Celsium JavaScript VM

This folder contains a small, dependency-free JavaScript reimplementation of the Celsium virtual machine.

### What it runs

- **Input**: the JSON produced by Rust `serde_json::to_string(&Vec<OPTCODE>)` (externally-tagged enums).
- **Stack values**: match Rust `StackValue` JSON (also externally-tagged enums).

### Usage (Node)

```js
const { CelsiumVM } = require("./vm");

const vm = new CelsiumVM({
  print: (s) => process.stdout.write(String(s)),
  input: (_prompt) => "hello",
  random: Math.random,
});

// bytecodeJson is the string returned by Rust `get_bytecode_json()`
vm.run(bytecodeJson);
```

### Demo

```bash
node js_vm/demo.js
```

### Notes

- `CallFunction` is **not supported** in the standalone JS VM (the compiled global bytecode should use `JumpToFunction`).
- A couple of quirks in Rust arithmetic helpers were mirrored for closer parity.

