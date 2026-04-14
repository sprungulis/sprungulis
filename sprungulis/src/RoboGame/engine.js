const gridSize = 4;
const wallCount = 3;

function randomPosition(){
    return Math.floor(Math.random() * gridSize);
}

export function createInitialState(){
    
    const startPos = [randomPosition(),randomPosition()];

    let ballPosition = [...startPos];
    while (ballPosition[0]==startPos[0] && ballPosition[1]==startPos[1]){
        ballPosition = [randomPosition(),randomPosition()];
    }
    
    const wallSet = new Set();

        while (wallSet.size < wallCount) {
            const wx = Math.floor(Math.random() * gridSize);
            const wy = Math.floor(Math.random() * gridSize);

            const isStart = wx === startPos[0] && wy === startPos[1];
            const isGoal = wx === ballPosition[0] && wy === ballPosition[1];

            if (!isStart && !isGoal) {
                wallSet.add(`${wx},${wy}`);
            }
        }

        const wallArray = Array.from(wallSet).map(coord =>
            coord.split(',').map(Number)
        );

        const initialState = {
            robotPos: startPos,
            ballPos: ballPosition,
            pickedUp: false,
            walls: wallArray,
            gridSize,
        };

        return initialState;

}

export function ValidateMove(gameState,nextPos){
    let currentPos=gameState.robotPos;

    if(currentPos.length!=2 || nextPos.length!=2) return false;

    if(Math.abs(nextPos[0]-currentPos[0])+Math.abs(nextPos[1]-currentPos[1])!=1) return false;

    for(let wall of gameState.walls){
        if(nextPos[0]==wall[0]&&nextPos[1]==wall[1]) return false;
    }

    if(nextPos[0]<0 || nextPos[0]>=gridSize || nextPos[1]<0 || nextPos[1]>=gridSize) return false;
    return true;
}


export function genNextPos(gameState, dir) {
    const current = gameState.robotPos
    const dirMap = { left:[-1,0], right:[1,0], up:[0,-1], down:[0,1] };
    const dirNumeric = dirMap[dir];

    if (!dirNumeric) return null; 
    const nextPos = [current[0] + dirNumeric[0], current[1] + dirNumeric[1]]
    if (!ValidateMove(gameState,nextPos)) return null;

    return nextPos;
}

//state var pievienot ari "CodeMirror":"ko highlightot,samainit, etc.."
export function applyAction(gameState, action) {
    if (action.type === "move") {
        let stateList = []
        for(let i=0;i<action.times;i++){
        const nextPos = genNextPos(gameState, action.dir);

        if (!nextPos) return false;
        
        const nextState = {
            ...gameState,
            robotPos: nextPos,
            ballPos: gameState.pickedUp ? nextPos : gameState.ballPos,
        };
        
        stateList.push(nextState);
        gameState=nextState;
    }
        return stateList
    }

    

    if (action.type === "pickup") {
        if(gameState.robotPos[0]==gameState.ballPos[0] && gameState.robotPos[1]==gameState.ballPos[1]){
            return [{ ...gameState, pickedUp: true }];}
        return false;
    }

    if (action.type === "drop") {
        return [{ ...gameState, pickedUp: false }];
    }

    return false;
}

