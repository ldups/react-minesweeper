import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const GameStates = Object.freeze({
    PLAYING:   Symbol("playing"),
    WON:  Symbol("won"),
    LOST: Symbol("lost")
});

function Square(props){
    const flagChar = '\u{1F6A9}';
    const mineChar = '\u{1F4A3}';
    const wonChar = '\u{1F337}';
    let className = "revealed-square";

    let char = props.value;
    if (char === ""){
        className = "square";
    }
    if (char === 'M'){
        char = mineChar;
        if (props.gameStatus === GameStates.WON){
            char = wonChar;
        }
    }
    else if (char === 'F'){
        char = flagChar;
    }
    else if (char === 0){
        char = null;
    }

    if (props.gameStatus === GameStates.WON){
        className = "won-square";
    }

    return (
        <button className={className} onClick={props.onClick} onContextMenu={props.onContextMenu}>
            {char}
        </button>
    );
}

function RevealButton(props){
    return (
        <button className = "revealButton" onClick={props.onClick}>Reveal</button>
    );
}

class Board extends React.Component {
    constructor(props) {
        super(props);
        let dimension = this.props.dimension;

        let squareArray = new Array(dimension);
        for (let i = 0; i < squareArray.length; i++) {
            squareArray[i] = new Array(dimension);
            for (let j=0; j<dimension; j++){
                squareArray[i][j] = ''; 
            }
        }

        let mineCount = Math.ceil(0.15 * Math.pow(dimension, 2));
        let mineArray = new Array(dimension);
        let mineLocations = this.assignMines(mineCount, dimension);
        for (let i = 0; i < mineArray.length; i++) {
            mineArray[i] = new Array(dimension);
            for (let j=0; j<dimension; j++){
                let mine = false;
                if (mineLocations.includes(i*dimension + j)){
                    mine= true;
                }
                mineArray[i][j] = mine;
            }
        }
        
        console.log(mineArray);

        let mineDistArray = new Array(dimension);
        for (let i = 0; i < mineDistArray.length; i++) {
            mineDistArray[i] = new Array(dimension);
            for (let j=0; j<dimension; j++){
                if (mineArray[i][j]){
                    mineDistArray[i][j] = 'M';
                }
               else{
                mineDistArray[i][j] = calcMineNum(i,j,mineArray);
                }
            }
        }

        this.state = {
            squares: squareArray,
            mineCount: mineCount,
            masterArr: mineDistArray,
            gameState: GameStates.PLAYING,
        }
    }

    assignMines(numMines, dimension){
        let mineLocations = new Array(numMines);
        let ranNum = -1;
        for (let i=0; i<numMines;i++){
            do{
                ranNum = Math.floor(Math.random() * Math.pow(dimension,2));
            } while (mineLocations.includes(ranNum));
            mineLocations[i] = ranNum; 
        }
        return mineLocations;
    }

    handleClickSquare(row, column) {
        if (this.state.gameState === GameStates.PLAYING){
            const squares = this.state.squares.slice();
            const mastArr = this.state.masterArr;
            const truVal = mastArr[row][column];
            let mineC = this.state.mineCount;
            let nextGameState = GameStates.PLAYING;

            if (squares[row][column] === 'F'){
                mineC= mineC +1;
            }
            if (truVal === 'M'){
                nextGameState = GameStates.LOST;
                Object.assign(squares, mastArr);
            }
            else if (truVal !== 0){
                squares[row][column] = truVal;
            }
            else{
                let squaresToReveal = revealSquares(mastArr, squares, [[row, column]], row, column);
                for (let i=0; i<squaresToReveal.length;i++){
                    let ro = squaresToReveal[i][0];
                    let col = squaresToReveal[i][1];
                    squares[ro][col] = mastArr[ro][col];
                }
                squares[row][column] = truVal;
            }
            this.setState({
                squares: squares,
                mineCount: mineC,
                gameState: nextGameState,
            });
        }   
    }

    handleContextMenu(e, row, column) {
        e.preventDefault();
        
        if (this.state.gameState === GameStates.PLAYING){
            const squares = this.state.squares.slice();
            let mineC = this.state.mineCount;
            const mastArr = this.state.masterArr;
            let nextGameState = GameStates.PLAYING;
            
            if (mineC>0 && squares[row][column] === ''){
                squares[row][column] = 'F';
                mineC = mineC - 1;
            }
            else if (squares[row][column] === 'F'){
                squares[row][column] = '';
                mineC = mineC + 1;
            }
            if (calculateWinner(mastArr, squares)){
                nextGameState = GameStates.WON;
                Object.assign(squares, mastArr);
            }
            this.setState({
                squares: squares,
                mineCount: mineC,
                gameState: nextGameState,
            });
        }   
    }

    handleClickReveal(){
        const squares = this.state.squares.slice();
        const mastArr = this.state.masterArr;
        Object.assign(squares, mastArr);
        this.setState({
            squares: squares,
            gameState: GameStates.LOST,
        });
    }

    renderSquare(row, column) {
        let uniqueID = row*8 + column;
        return (
            <Square 
                value={this.state.squares[row][column]}
                onClick={() => this.handleClickSquare(row,column)}
                onContextMenu={(event) => this.handleContextMenu(event,row,column)}
                key={uniqueID}
                gameStatus={this.state.gameState}
            />
        );
    }

    renderRevealButton() {
        return (
            <RevealButton
                onClick={() => this.handleClickReveal()}
            />
        );
    }

    render() {
        var self=this
        let squareList = this.state.squares.map(function(row, rowIndex){
            let renderedRow = row.map( function(column, columnIndex) { 
                return self.renderSquare(rowIndex,columnIndex,);
            })
            return <div className="boardRow" key={rowIndex}>{renderedRow}</div>
          })

        let mineDisplay = this.state.mineCount + " Mines Left";

        let status = "Playing";
        if (this.state.gameState === GameStates.WON){
            status = "You won!";
            mineDisplay = '';
        }
        else if (this.state.gameState === GameStates.LOST){
            status = "You lost!";
            mineDisplay = '';
        }

        let revealButton = this.renderRevealButton();

        return (
            <div>
                <div className='title' >Mine Sweeper</div>
                <div className='status'>Status: {status}</div>
                <div className='mineCount'>{mineDisplay}</div>
                <div>{revealButton}</div>
                <div> {squareList} </div>
            </div>
        )
    }
}

function revealSquares(masterArray, squareArray, alreadyRevealedSquares, i, j){
    let adjSquares = findAdjacentIndeces(i,j,masterArray);
    let squaresToReveal = [];
    for (let i=0; i< adjSquares.length; i++){
        let row = adjSquares[i][0];
        let column = adjSquares[i][1];
        if (!alreadyRevealedSquares.some(e => e[0] === row && e[1] === column)){
            if (squareArray[row][column] === ''){
                if (masterArray[row][column] === 0){
                    squaresToReveal.push([row,column]);
                    squaresToReveal= squaresToReveal.concat(revealSquares(masterArray, squareArray, squaresToReveal.concat(alreadyRevealedSquares), row, column));
                }
                else if (masterArray[row][column] !== "M"){
                    squaresToReveal.push([row,column]);
                } 
            }
        }
    }
    return squaresToReveal;
}

function calculateWinner(masterArray, squareStates){
    for (let i=0; i< masterArray.length;i++){
        for (let j=0; j<masterArray[0].length; j++){
            if (masterArray[i][j] === 'M' && squareStates[i][j] !== 'F'){
                return false;
            }
        }
    }
    return true;
}

function isValidIndex(i,j,w,h){
    if (i<0 || j<0){
        return false;
    }
    if (i> h - 1 || j> w -1){
        return false;
    }
    return true;
}

function findAdjacentIndeces(i,j,arr){
    let adjInd = [];
    let width = arr.length;
    let height = arr[0].length;
    
    if (isValidIndex(i-1,j-1,width,height)){
        adjInd.push([i-1,j-1]);
    }
    if (isValidIndex(i-1,j,width,height)){
        adjInd.push([i-1,j]);
    }
    if (isValidIndex(i-1,j+1,width,height)){
        adjInd.push([i-1,j+1]);
    }
    if (isValidIndex(i,j-1,width,height)){
        adjInd.push([i,j-1]);
    }
    if (isValidIndex(i,j+1,width,height)){
        adjInd.push([i,j+1]);
    }
    if (isValidIndex(i+1,j-1,width,height)){
        adjInd.push([i+1,j-1]);
    }
    if (isValidIndex(i+1,j,width,height)){
        adjInd.push([i+1,j]);
    }
    if (isValidIndex(i+1,j+1,width,height)){
        adjInd.push([i+1,j+1]);
    }
    return adjInd;
}

function calcMineNum(i,j,mineArray){
    let adjInd = findAdjacentIndeces(i,j,mineArray);
    let mineCount = 0;
    for (let i=0; i<adjInd.length; i++){
        let row = adjInd[i][0];
        let column = adjInd[i][1];
        if (mineArray[row][column]){
            mineCount ++;
        }
    }
    return mineCount;

}

class Game extends React.Component {
    render() {
        return (
            <div className='game'>
                <div className='gameBoard'>
                    <Board
                        dimension={8}
                    />
                </div>
            </div>
        )
    }
}

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);