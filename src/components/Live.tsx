import React, { useCallback, useEffect, useState } from "react"
import { useBroadcastEvent, useEventListener, useMyPresence } from "../../liveblocks.config"
import LiveCursors from "./cursor/LiveCursors"
import CursorChat from "./cursor/CursorChat"
import { CursorMode, CursorState, Reaction } from "@/types/type"
import ReactionSelector from "./reaction/ReactionButton"
import FlyingReaction from "./reaction/FlyingReaction"
import useInterval from "@/hooks/useInterval"
import { Comments } from "./comments/Comments"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu"
import { shortcuts } from "@/constants"

interface Props {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  undo: () => void
  redo: () => void
}

const Live = ({ canvasRef, undo, redo }: Props) => {
  const [{ cursor }, updateMyPresence] = useMyPresence()
  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  })

  const [reaction, setReaction] = useState<Reaction[]>([])

  const broadcast = useBroadcastEvent()

  useInterval(() => {
    setReaction((reactions) => reactions.filter((reaction) => Date.now() - reaction.timestamp < 2000))
  }, 1000)

  useInterval(() => {
    if(cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor) {
      setReaction((reactions) => reactions.concat([{
        point: { x: cursor.x, y: cursor.y },
        value: cursorState.reaction,
        timestamp: Date.now()
      }]))
      broadcast({
        x: cursor.x,
        y: cursor.y,
        value: cursorState.reaction,
      })
    } 
  }, 100)

  useEventListener(eventData => {
    const event = eventData.event
    setReaction((reactions) => reactions.concat([{
      point: { x: event.x, y: event.y },
      value: event.value,
      timestamp: Date.now()
    }]))
  })
  
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    if(cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y
      updateMyPresence({ cursor: { x, y } })
    }
  }, [])

  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    setCursorState({ mode: CursorMode.Hidden })
    updateMyPresence({ cursor: null, message: null })
  }, [])

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    const x = event.clientX - event.currentTarget.getBoundingClientRect().x
    const y = event.clientY - event.currentTarget.getBoundingClientRect().y
    updateMyPresence({ cursor: { x, y } })
    setCursorState((state: CursorState) => cursorState.mode === CursorMode.ReactionSelector ? { ...state, isPressed: true } : state)
  }, [cursorState.mode, setCursorState])

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    setCursorState((state: CursorState) => cursorState.mode === CursorMode.ReactionSelector ? { ...state, isPressed: true } : state)
  }, [cursorState.mode, setCursorState])
  
  const setReactions = useCallback((reaction: string) => {
    setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false })
  }, [])


  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "/") {
        setCursorState({ mode: CursorMode.Chat, previousMessage: null, message: ""})
      } else if (e.key === "Escape") {
        updateMyPresence({ message: '' })
        setCursorState({ mode: CursorMode.Hidden })
      } else if (e.key === "e") {
        setCursorState({ mode: CursorMode.ReactionSelector })
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault()
      }
    }

    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [updateMyPresence])

  const handleContextMenuClick = useCallback((key: string) => {
    switch (key) {
      case 'Chat':
        setCursorState({ mode: CursorMode.Chat, previousMessage: null, message: ""})
        break;
      case 'Undo':
        undo()
        break;
      case 'Redo':
        redo()
        break;
      case 'Reactions':
        setCursorState({ mode: CursorMode.ReactionSelector })
        break;
      default:
        break;
    }
  }, [])

  return (
    <ContextMenu>
    <ContextMenuTrigger
      id='canvas'
      className="h-screen w-full flex justify-center items-center relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <canvas ref={canvasRef} />
      {reaction.map(r => (
        <FlyingReaction
          key={r.timestamp.toString()}
          x={r.point.x}
          y={r.point.y}
          timestamp={r.timestamp}
          value={r.value}
        />
      ))}
      {cursor && (
        <CursorChat
          cursor={cursor}
          cursorState={cursorState}
          setCursorState={setCursorState}
          updateMyPresence={updateMyPresence}
        />
      )}
      {cursorState.mode === CursorMode.ReactionSelector && (
        <ReactionSelector
          setReaction={setReactions}
        />
      )}
      <LiveCursors />
      <Comments />
    </ContextMenuTrigger>
    <ContextMenuContent className="right-menu-content">
        {shortcuts.map((item) => (
          <ContextMenuItem
            key={item.key}
            className="flex justify-between right-menu-item"
            onClick={() => handleContextMenuClick(item.name)}
          >
            <p>{item.name}</p>
            <p className="text-xs text-primary-grey-300">{item.shortcut}</p>
          </ContextMenuItem>
        ))}
    </ContextMenuContent>
    </ContextMenu>
  )
}
export default Live