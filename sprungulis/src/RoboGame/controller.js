import {applyAction} from './engine.js'
import { createInitialState } from './engine.js';

export const stateList = []
const doneListeners = new Set();

function notifyDone() {
    const snapshot = stateList.map((state) => ({
        ...state,
        robotPos: [...state.robotPos],
        ballPos: [...state.ballPos],
        walls: state.walls.map((wall) => [...wall]),
    }));

    doneListeners.forEach((listener) => listener(snapshot));
}

export function onDone(listener) {
    doneListeners.add(listener);
    return () => {
        doneListeners.delete(listener);
    };
}


export function input(input){

    let action;

    //-----------iespejamas darbibas--------------
    if(input.includes("move")){
        const [_,dir,times]=input.split(" ");
        action={"type":"move","dir":dir,"times":parseInt(times)};
    }
    else if(input.includes("pickup")){
        action={"type":"pickup"};
    }
    else if(input.includes("drop")){
        action={"type":"drop"}
    }
    else if(input.includes("done")){
        notifyDone();
        return true;
    }
    //------------------------

    const nextState=applyAction(stateList[stateList.length-1],action);

    if (!nextState){
        console.log("ERROR: failed on action: "+input);
        return false
    }
    stateList.push(...nextState);
    return true;
}
export function InitialState(){
    const firstState=createInitialState();
    stateList.push(firstState);
    return firstState;
}

