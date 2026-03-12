/**
 * Celsium JavaScript VM
 *
 * Executes the same serde_json bytecode produced by the Rust implementation.
 *
 * Notes:
 * - The Rust bytecode is externally tagged enums, e.g. { "LoadInt": { "value": 1 } }.
 * - Stack values are also externally tagged enums, e.g. { "Int": { "value": 123 } }.
 */

function assert(condition, message) {
  // if (!condition) throw new Error(message);
}

function opcodeTag(op) {
  const keys = Object.keys(op);
  assert(keys.length === 1, `Invalid opcode shape: ${JSON.stringify(op)}`);
  const tag = keys[0];
  return [tag, op[tag]];
}

function svTag(sv) {
  const keys = Object.keys(sv);
  assert(keys.length === 1, `Invalid StackValue shape: ${JSON.stringify(sv)}`);
  const tag = keys[0];
  return [tag, sv[tag]];
}

function svBool(value) {
  return { Bool: { value: !!value } };
}
function svInt(value) {
  // Rust i64 -> JS number (best-effort)
  assert(Number.isFinite(value), "Int must be finite");
  return { Int: { value: Math.trunc(value) } };
}
function svFloat(value) {
  assert(Number.isFinite(value), "Float must be finite");
  return { Float: { value: value } };
}
function svString(value) {
  return { String: { value: String(value) } };
}
function svArray(value) {
  return { Array: { value } };
}
function svObject(fields) {
  return { Object: { value: fields } };
}

function stackvalueToInt(sv) {
  const [tag, payload] = svTag(sv);
  if (tag !== "Int") throw new Error("Expected Int");
  return payload.value;
}

function stackvalueToString(sv) {
  const [tag, payload] = svTag(sv);
  if (tag !== "String") throw new Error("Expected String");
  return payload.value;
}

function popArguments(vm, count) {
  const args = [];
  for (let i = 0; i < count; i++) args.push(vm.pop());
  return args;
}

function formatForPrint(value, newline) {
  const [tag, payload] = svTag(value);
  switch (tag) {
    case "Bool": {
      const s = payload.value ? "1" : "0";
      return newline ? `${s}\n` : s;
    }
    case "Int": {
      const s = String(payload.value);
      return newline ? `${s}\n` : s;
    }
    case "String": {
      const s = String(payload.value);
      return newline ? `${s}\n` : s;
    }
    case "Float": {
      const s = String(payload.value).replace(".", ",");
      return newline ? `${s}\n` : s;
    }
    case "Array": {
      const arr = payload.value;
      let printable = "[";
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const itemPrinted = formatForPrint(item, false);
        const [itemTag] = svTag(item);
        if (itemTag === "String") printable += `"${itemPrinted}"`;
        else printable += itemPrinted;
        if (i !== arr.length - 1) printable += ";";
      }
      printable += newline ? "]\n" : "]";
      return printable;
    }
    case "Object": {
      const fields = payload.value;
      let printable = "Objekts {\n";
      for (const field of fields) {
        printable += `   ${field.name}: ${formatForPrint(field.value, false)}\n`;
      }
      printable += "}";
      return newline ? `${printable}\n` : printable;
    }
    default:
      throw new Error(`Unknown StackValue tag: ${tag}`);
  }
}

// --- math_operators.rs parity (including a couple of quirks) ---

function add(a, b) {
  const [tagA, payloadA] = svTag(a);
  switch (tagA) {
    case "Bool":
      throw new Error("Cannot do addition with bool's");
    case "Int":
      return addToInt(payloadA.value, b);
    case "String":
      return addToString(payloadA.value, b);
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      return addToFloat(payloadA.value, b);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagA}`);
  }
}

function addToInt(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot add Bool to INT");
    case "Int":
      return svInt(a + payloadB.value);
    case "String":
      return svString(String(a) + payloadB.value);
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float": {
      const v = payloadB.value;
      if (Math.trunc(v) === v) return svInt(a + v);
      return svFloat(a + v);
    }
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function addToString(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot add Bool to String");
    case "Int":
      return svString(a + String(payloadB.value));
    case "String":
      return svString(a + payloadB.value);
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      return svString(a + String(payloadB.value).replace(".", ","));
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function addToFloat(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot add Bool to Float");
    case "Int":
      return svFloat(a + payloadB.value);
    case "String":
      return svString(String(a).replace(".", ",") + payloadB.value);
    case "Array":
      throw new Error("Cannot do math with Arrays");
    case "Float":
      return svFloat(a + payloadB.value);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function subtract(a, b) {
  const [tagA, payloadA] = svTag(a);
  switch (tagA) {
    case "Bool":
      throw new Error("Cannot do subtraction with Bool's");
    case "Int":
      return subtractFromInt(payloadA.value, b);
    case "String":
      throw new Error("Cannot do subtraction with String's");
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      // Rust code has a quirk: it passes `a` again instead of `b`
      return subtractFromFloat(payloadA.value, a);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagA}`);
  }
}

function subtractFromInt(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot subtract Bool to INT");
    case "Int":
      return svInt(a - payloadB.value);
    case "String":
      throw new Error("Cannot subtract string from MAGICINT");
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      return svFloat(a - payloadB.value);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function subtractFromFloat(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot subtract Bool from Float");
    case "Int":
      return svFloat(a - payloadB.value);
    case "String":
      throw new Error("Cannot subtract strings");
    case "Array":
      throw new Error("Cannot do math with Arrays");
    case "Float":
      return svFloat(a - payloadB.value);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function multiply(a, b) {
  const [tagA, payloadA] = svTag(a);
  switch (tagA) {
    case "Bool":
      throw new Error("Cannot do multiplication with Bool's");
    case "Int":
      return multiplyWithInt(payloadA.value, b);
    case "String":
      throw new Error("Cannot do multiplication with String's");
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      return multiplyWithFloat(payloadA.value, b);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagA}`);
  }
}

function multiplyWithInt(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot multiply Bool with MAGICINT");
    case "Int":
      return svInt(a * payloadB.value);
    case "String":
      throw new Error("Cannot multiply string with MAGICINT");
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      return svFloat(payloadB.value * a);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function multiplyWithFloat(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot multiply Bool with Float");
    case "Int":
      return svFloat(a * payloadB.value);
    case "String":
      throw new Error("Cannot multiply string with MAGICINT");
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      return svFloat(payloadB.value * a);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function divide(a, b) {
  const [tagA, payloadA] = svTag(a);
  switch (tagA) {
    case "Bool":
      throw new Error("Cannot do division with Bool's");
    case "Int":
      return divideWithInt(payloadA.value, b);
    case "String":
      throw new Error("Cannot do division with String's");
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      return divideWithFloat(payloadA.value, b);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagA}`);
  }
}

function divideWithInt(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot divide Bool with MAGICINT");
    case "Int":
      return svInt(Math.trunc(a / payloadB.value));
    case "String":
      throw new Error("Cannot divide String with MAGICINT");
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      // Rust quirk: value / a (reversed)
      return svFloat(payloadB.value / a);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function divideWithFloat(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot multiply Bool with Float");
    case "Int":
      // Rust quirk: value / a (reversed)
      return svFloat(payloadB.value / a);
    case "String":
      throw new Error("Cannot multiply string with MAGICINT");
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      return svFloat(a / payloadB.value);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function remainder(a, b) {
  const [tagA, payloadA] = svTag(a);
  switch (tagA) {
    case "Bool":
      throw new Error("Cannot do division with Bool's");
    case "Int":
      return remainderWithInt(payloadA.value, b);
    case "String":
      throw new Error("Cannot do division with String's");
    case "Array":
      throw new Error("Cannot do addition with Arrays");
    case "Float":
      return remainderWithFloat(payloadA.value, b);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagA}`);
  }
}

function remainderWithInt(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot divide Bool with MAGICINT");
    case "Int":
      return svInt(a % payloadB.value);
    case "String":
      throw new Error("Cannot divide String with MAGICINT");
    case "Array":
      throw new Error("Cannot do math with Arrays");
    case "Float":
      return svFloat(a % payloadB.value);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function remainderWithFloat(a, b) {
  const [tagB, payloadB] = svTag(b);
  switch (tagB) {
    case "Bool":
      throw new Error("Cannot divide Bool with MAGICINT");
    case "Int":
      return svFloat(a % payloadB.value);
    case "String":
      throw new Error("Cannot divide String with MAGICINT");
    case "Array":
      throw new Error("Cannot do math with Arrays");
    case "Float":
      return svFloat(a % payloadB.value);
    case "Object":
      throw new Error("Cannot do math with objects.");
    default:
      throw new Error(`Unknown StackValue tag: ${tagB}`);
  }
}

function cmpOp(a, b, op) {
  const [tagA, payloadA] = svTag(a);
  const [tagB, payloadB] = svTag(b);

  if (tagA === "String" || tagB === "String") throw new Error("Cannot do comparisons  with String's");
  if (tagA === "Array" || tagB === "Array") throw new Error("Cannot do comparisons with Arrays");
  if (tagA === "Object" || tagB === "Object") throw new Error("Cannot do math with objects.");

  const aNum =
    tagA === "Bool" ? (payloadA.value ? 1 : 0) : tagA === "Int" ? payloadA.value : payloadA.value;
  const bNum =
    tagB === "Bool" ? (payloadB.value ? 1 : 0) : tagB === "Int" ? payloadB.value : payloadB.value;

  switch (op) {
    case "<":
      return svBool(aNum < bNum);
    case ">":
      return svBool(aNum > bNum);
    case "<=":
      return svBool(aNum <= bNum);
    case ">=":
      return svBool(aNum >= bNum);
    default:
      throw new Error(`Unknown comparison op ${op}`);
  }
}

function notEq(a, b) {
  const [tagA, payloadA] = svTag(a);
  const [tagB, payloadB] = svTag(b);
  if (tagA !== tagB) return svBool(true);

  switch (tagA) {
    case "Bool":
    case "Int":
    case "String":
      return svBool(payloadA.value !== payloadB.value);
    case "Float":
      return svBool(payloadA.value !== payloadB.value);
    default:
      throw new Error("Cannot do math with objects.");
  }
}

function eq(a, b) {
  const ne = notEq(a, b);
  return svBool(!svTag(ne)[1].value);
}

function andOp(a, b) {
  const [tagA, payloadA] = svTag(a);
  const [tagB, payloadB] = svTag(b);
  assert(tagA === "Bool" && tagB === "Bool", "and expects bools");
  return svBool(payloadA.value === true && payloadB.value === true);
}
function orOp(a, b) {
  const [tagA, payloadA] = svTag(a);
  const [tagB, payloadB] = svTag(b);
  assert(tagA === "Bool" && tagB === "Bool", "or expects bools");
  return svBool(payloadA.value === true || payloadB.value === true);
}
function xorOp(a, b) {
  const [tagA, payloadA] = svTag(a);
  const [tagB, payloadB] = svTag(b);
  assert(tagA === "Bool" && tagB === "Bool", "xor expects bools");
  return svBool(!!payloadA.value !== !!payloadB.value);
}

function mustJump(value) {
  const [tag, payload] = svTag(value);
  if (tag === "Int" && payload.value === 0) return true;
  if (tag === "String" && payload.value === "") return true;
  if (tag === "Bool" && payload.value === false) return true;
  return false;
}

class CelsiumVM {
  constructor(options = {}) {
    this.stack = [];
    this.variables = new Map();
    this.testingStack = [];
    this.callStack = [];

    this.print = options.print || ((s) => process.stdout.write(String(s)));
    this.input = options.input || (() => "");
    this.random = options.random || Math.random;
    this.code_replace = options.code_replace
  }

  pushStackValue(sv) {
    this.stack.push(sv);
  }
  pop() {
    assert(this.stack.length > 0, "Stack underflow");
    return this.stack.pop();
  }
  peek() {
    return this.stack.length ? this.stack[this.stack.length - 1] : null;
  }

  pushToTestingStack(duplicate) {
    if (!this.stack.length) return;
    const value = duplicate ? structuredClone(this.peek()) : this.pop();
    this.testingStack.push(value);
  }

  defineVar(id) {
    const value = this.pop();
    this.variables.set(id, value);
  }
  assignVar(id) {
    const value = this.pop();
    assert(this.variables.has(id), `Could not find variable with ID ${id}`);
    this.variables.set(id, value);
  }
  copyVarValue(srcId, dstId) {
    assert(this.variables.has(srcId), `Could not find variable with ID ${srcId}`);
    const src = structuredClone(this.variables.get(srcId));
    this.variables.set(dstId, src);
  }
  loadVar(id) {
    assert(this.variables.has(id), `Could not find variable id ${id}`);
    this.pushStackValue(structuredClone(this.variables.get(id)));
  }

  getIndex() {
    const indexSv = this.pop();
    const index = stackvalueToInt(indexSv);
    const indexable = this.pop();
    const [tag, payload] = svTag(indexable);
    let result;
    if (tag === "Array") {
      result = structuredClone(payload.value[index]);
    } else if (tag === "String") {
      result = svString(Array.from(payload.value)[index]);
    } else {
      throw new Error("Attempted index non-array");
    }
    this.pushStackValue(result);
  }

  setAtArray(id) {
    const indexSv = this.pop();
    const index = stackvalueToInt(indexSv);
    assert(this.variables.has(id), `Could not find variable named ${id}`);
    const arrSv = this.variables.get(id);
    const [tag, payload] = svTag(arrSv);
    if (tag !== "Array") throw new Error(`${id} is not an array`);
    const valueToSet = this.pop();
    const newArr = structuredClone(payload.value);
    newArr[index] = valueToSet;
    this.variables.set(id, svArray(newArr));
  }

  pushToArray(id) {
    assert(this.variables.has(id), `Could not find variable named ${id}`);
    const arrSv = this.variables.get(id);
    const [tag, payload] = svTag(arrSv);
    if (tag !== "Array") throw new Error(`${id} is not an array`);
    const valueToPush = this.pop();
    const newArr = structuredClone(payload.value);
    newArr.push(valueToPush);
    // Note: Rust's implementation forgets to write back; we write back to be useful.
    this.variables.set(id, svArray(newArr));
  }

  getArrayLength(id) {
    assert(this.variables.has(id), `Could not find variable named ${id}`);
    const arrSv = this.variables.get(id);
    const [tag, payload] = svTag(arrSv);
    if (tag !== "Array") throw new Error(`${id} is not an array`);
    this.pushStackValue(svInt(payload.value.length));
  }

  getObjectField(fieldName) {
    const objSv = this.pop();
    const [tag, payload] = svTag(objSv);
    if (tag !== "Object") throw new Error("not an object");
    for (const field of payload.value) {
      if (field.name === fieldName) {
        this.pushStackValue(structuredClone(field.value));
        return;
      }
    }
  }

  setObjectField(id, fieldName) {
    const newFieldValue = this.pop();
    assert(this.variables.has(id), `Could not find variable with ID ${id}`);
    const objSv = this.variables.get(id);
    const [tag, payload] = svTag(objSv);
    if (tag !== "Object") throw new Error("Expected object variable");
    const newFields = structuredClone(payload.value);
    for (const field of newFields) {
      if (field.name === fieldName) field.value = newFieldValue;
    }
    this.variables.set(id, svObject(newFields));
  }

  notOp() {
    const v = this.pop();
    const [tag, payload] = svTag(v);
    let ret;
    switch (tag) {
      case "Bool":
        ret = !payload.value;
        break;
      case "Int":
        ret = payload.value === 0;
        break;
      case "Float":
        ret = payload.value === 0.0;
        break;
      case "String":
        ret = payload.value === "";
        break;
      case "Array":
        ret = payload.value.length === 0;
        break;
      case "Object":
        ret = false;
        break;
      default:
        ret = false;
    }
    this.pushStackValue(svBool(ret));
  }

  formatForPrint(newline) {
    if (!this.stack.length) return "";
    return formatForPrint(this.pop(), newline);
  }

  // --- std special functions ---
  special(functionName) {
    switch (functionName) {
      case "izvade": {
        const printable = this.formatForPrint(true);
        this.print(printable);
        return;
      }
      case "izvadetp": {
        const printable = this.formatForPrint(false);
        this.print(printable);
        return;
      }
      case "ievade": {
        const res = this.input("");
        if (typeof res !== "string") {
          throw new Error("input() must return a string (sync).");
        }
        this.pushStackValue(svString(res));
        return;
      }
      case "garums": {
        const value = this.pop();
        const [tag, payload] = svTag(value);
        let len;
        switch (tag) {
          case "Bool":
            len = 1;
            break;
          case "Int":
            len = String(payload.value).length;
            break;
          case "Float":
            len = String(payload.value).length;
            break;
          case "String":
            len = payload.value.length;
            break;
          case "Array":
            len = payload.value.length;
            break;
          case "Object":
            len = payload.value.length;
            break;
          default:
            len = 0;
        }
        this.pushStackValue(svInt(len));
        return;
      }
      case "nejaušs": {
        const v = this.random();
        this.pushStackValue(svFloat(v));
        return;
      }
      case "nejaušs_robežās": {
        const args = popArguments(this, 2);
        const min = stackvalueToInt(args[1]);
        const max = stackvalueToInt(args[0]);
        // Rust returns an Int here (even though signature says Float in std::get_std_functions)
        const value = Math.floor(min + this.random() * (max - min));
        this.pushStackValue(svInt(value));
        return;
      }
      case "code_replace": {
        const args = popArguments(this, 4);
        this.code_replace(args[0], args[1], args[2], args[3]);
      }
      default:
        throw new Error(`Unknown special function: ${functionName}`);
    }
  }

  run(bytecodeJsonOrObject) {
    console.log("called");
    
    const bytecode = Array.isArray(bytecodeJsonOrObject)
      ? bytecodeJsonOrObject
      : JSON.parse(bytecodeJsonOrObject);

    let index = 0;
    while (index < bytecode.length) {
      const op = bytecode[index];
      const [tag, payload] = opcodeTag(op);

      switch (tag) {
        case "PushToTestingStack":
          this.pushToTestingStack(payload.duplicate_stackvalue);
          break;
        case "LoadInt":
          this.pushStackValue(svInt(payload.value));
          break;
        case "LoadBool":
          this.pushStackValue(svBool(payload.value));
          break;
        case "LoadString":
          this.pushStackValue(svString(payload.value));
          break;
        case "LoadFloat":
          this.pushStackValue(svFloat(payload.value));
          break;
        case "DefineVar":
          this.defineVar(payload.id);
          break;
        case "AssignVar":
          this.assignVar(payload.id);
          break;
        case "CopyVariableValue":
          this.copyVarValue(payload.src_var_id, payload.dst_var_id);
          break;
        case "LoadVar":
          this.loadVar(payload.id);
          break;
        case "DefineObject": {
          const object = this.pop();
          this.variables.set(payload.id, object);
          break;
        }
        case "CreateArray": {
          const init = [];
          for (let i = 0; i < payload.init_values_count; i++) init.push(this.pop());
          init.reverse();
          this.pushStackValue(svArray(init));
          break;
        }
        case "GetIndex":
          this.getIndex();
          break;
        case "AssignAtArrayIndex":
          this.setAtArray(payload.id);
          break;
        case "PushToArray":
          this.pushToArray(payload.id);
          break;
        case "GettArrayLength":
          this.getArrayLength(payload.id);
          break;
        case "CreateObject": {
          const fieldNames = structuredClone(payload.field_names).reverse();
          const fields = [];
          for (const name of fieldNames) fields.push({ name, value: this.pop() });
          this.pushStackValue(svObject(fields));
          break;
        }
        case "GetObjectField":
          this.getObjectField(payload.field_name);
          break;
        case "SetObjectField":
          this.setObjectField(payload.id, payload.field_name);
          break;
        case "CallSpecialFunction":
          this.special(payload.function);
          break;
        case "SimpleLoop": {
          const countSv = this.pop();
          const [cTag, cPayload] = svTag(countSv);
          if (cTag !== "Int") throw new Error("Loop count is not an int");
          const body = payload.body_block.bytecode;
          for (let i = 0; i < cPayload.value; i++) {
            this.run(body);
          }
          break;
        }
        case "JumpIfFalse": {
          const v = this.pop();
          if (mustJump(v)) index += payload.steps;
          break;
        }
        case "Jump":
          index += payload.steps;
          break;
        case "JumpBack":
          index -= payload.steps;
          break;
        case "JumpToFunction":
          this.callStack.push({ optode_index: index, function_name: payload.function_name ?? null });
          index = payload.target;
          break;
        case "Return": {
          const item = this.callStack.pop();
          if (!item) return this.testingStack;
          index = item.optode_index;
          break;
        }
        case "CallFunction":
          throw new Error(
            "CallFunction is not supported by the standalone JS VM. " +
              "Use JumpToFunction (compiled global bytecode) instead."
          );
        case "Add": {
          console.log(payload);
          
          const b = this.pop();
          const a = this.pop();
          const result = add(a, b);
          this.pushStackValue(result);
          setTimeout(() => {

            this.code_replace(
              formatForPrint(result, false),
              payload.span.line,
              payload.span.col_start,
              payload.span.length,
            );
          }, 1000)
          break;
        }
        case "Subtract": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(subtract(a, b));
          break;
        }
        case "Multiply": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(multiply(a, b));
          break;
        }
        case "Divide": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(divide(a, b));
          break;
        }
        case "Remainder": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(remainder(a, b));
          break;
        }
        case "LessThan": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(cmpOp(a, b, "<"));
          break;
        }
        case "LargerThan": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(cmpOp(a, b, ">"));
          break;
        }
        case "LessOrEq": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(cmpOp(a, b, "<="));
          break;
        }
        case "LargerOrEq": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(cmpOp(a, b, ">="));
          break;
        }
        case "NotEq": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(notEq(a, b));
          break;
        }
        case "Eq": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(eq(a, b));
          break;
        }
        case "And": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(andOp(a, b));
          break;
        }
        case "Or": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(orOp(a, b));
          break;
        }
        case "Xor": {
          const b = this.pop();
          const a = this.pop();
          this.pushStackValue(xorOp(a, b));
          break;
        }
        case "Not":
          this.notOp();
          break;
        case "Break":
        case "Continue":
          throw new Error(`${tag} should not appear in bytecode`);
        default:
          console.log(`Unknown opcode: ${tag}`);
      }

      index += 1;
    }

    return this.testingStack;
  }
}

module.exports = {
  CelsiumVM,
  // exporting helpers is handy for tests/tools
  formatForPrint,
};

