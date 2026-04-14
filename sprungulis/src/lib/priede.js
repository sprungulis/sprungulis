import { useState } from "react";
import { replaceCode } from "../App";
export const worker = new Worker("../worker.js");

function send_code_replace_msg(a, line, col, span) {
  worker.postMessage({
    type: "code_replace",
    new_value: a,
    line: line,
    col: col,
    span: span,
  });
}

function decrement() {
  worker.postMessage({ type: "decrement" });
}
export function wasm_print(a) {
  console.log(a);
  //Priedes izvades funkcija
}

export function error_message(message) {
  console.error(message);
  worker.postMessage({
    type: "error",
    message,
  });
}

export function get_stumbrs_data() {
  return null;
}

export function code_replace(a, line, col, span) {
  console.log(a, line, col, span);
  //Koda aizvietošana
  send_code_replace_msg(a, line, col, span);
}

export async function wasm_input() {
  return "teststring";
  //Input funkcija, pagaidām nestrādā
}
export function explain(a, line, col, span) {
  worker.postMessage({
    type: "explain",
    message: a,
    line: line,
  });
}

export function funkcija(){
  
}

export function step() {}
