import CursorSVG from "@/public/assets/CursorSVG"

interface Props {
  color: string
  x: number
  y: number
  message: string
}

const Cursor = ({color, x, y, message}: Props) => {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0"
      style={{
        transform: `translate(${x}px, ${y}px)`
      }}
    >
      <CursorSVG color={color}/>
      {message && (
        <div className="absolute left-2 top-5 px-4 py-2 text-sm leading-relaxed text-white rounded-3xl"
          style={{
            backgroundColor: color
          }}
        >
          <p className="text-white whitespace-nowrap text-sm leading-relaxed">{message}</p>
        </div>
      )}
    </div>
  )
}
export default Cursor