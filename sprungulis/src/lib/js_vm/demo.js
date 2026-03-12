const { CelsiumVM } = require("./vm");

// Minimal demo bytecode:
// - push 2, push 3, add => 5
// - duplicate top into testing stack
// - print top with newline (izvade) (pops for print)
const bytecode = [
  { LoadInt: { value: 2 } },
  { LoadInt: { value: 3 } },
  { Add: { span: { line: 0, col_start: 0, length: 0 } } },
  { PushToTestingStack: { duplicate_stackvalue: true } },
  { CallSpecialFunction: { function: "izvade" } },
];

const out = [];
const vm = new CelsiumVM({
  print: (s) => out.push(String(s)),
  input: () => "demo-input",
  random: () => 0.5,
});

const testingStack = vm.run(bytecode);

console.log("Printed output:", JSON.stringify(out.join("")));
console.log("Testing stack:", JSON.stringify(testingStack, null, 2));

