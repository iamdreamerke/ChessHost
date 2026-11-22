// Decorative start-position board used in the control room preview.
const BACK = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜']
const WBACK = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']

function pieceAt(r: number, c: number) {
  if (r === 0) return BACK[c]
  if (r === 1) return '♟'
  if (r === 6) return '♙'
  if (r === 7) return WBACK[c]
  return ''
}

export default function ChessBoard() {
  const squares = []
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      squares.push(
        <div key={`${r}${c}`} className={'sq ' + ((r + c) % 2 === 0 ? 'light' : 'dark')}>
          {pieceAt(r, c)}
        </div>,
      )
  return (
    <div className="chess-board" aria-label="Chess board preview">
      <div className="board-coords top-coords">{[8, 7, 6, 5, 4, 3, 2, 1].map((n) => <span key={n}>{n}</span>)}</div>
      <div className="board-squares">{squares}</div>
      <div className="board-coords bottom-coords">{'abcdefgh'.split('').map((l) => <span key={l}>{l}</span>)}</div>
    </div>
  )
}
