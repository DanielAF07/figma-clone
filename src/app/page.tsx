// import dynamic from "next/dynamic";

// const App = dynamic(() => import('./App'), { ssr: false });

// export default App;

'use client'
import {fabric} from 'fabric'
import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { useEffect, useRef, useState } from "react";
import { handleCanvasMouseDown, handleCanvasMouseUp, handleCanvasObjectModified, handleCanvasObjectScaling, handleCanvasSelectionCreated, handleCanvaseMouseMove, handlePathCreated, handleResize, initializeFabric, renderCanvas } from '@/lib/canvas';
import { ActiveElement, Attributes } from '@/types/type';
import { useMutation, useRedo, useStorage, useUndo } from '../../liveblocks.config';
import { defaultNavElement } from '@/constants';
import { handleDelete, handleKeyDown } from '@/lib/key-events';
import { handleImageUpload } from '@/lib/shapes';

export default function Page() {
  const undo = useUndo()
  const redo = useRedo()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const isDrawing = useRef(false)
  const shapeRef = useRef<fabric.Object | null>(null)
  const selectedShapeRef = useRef<string | null>(null)
  const activeObjectRef = useRef<fabric.Object | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const isEditingRef = useRef(false)

  const canvasObjects = useStorage((root) => root.canvasObjects)

  const [elementsAttributes, setElementAttributes] = useState<Attributes>({
    width: '',
    height: '',
    fontSize: '',
    fontFamily: '',
    fontWeight: '',
    fill: '#aabbcc',
    stroke: '#aabbcc',
  })

  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if(!object) return
    const { objectId } = object

    const shapeData = object.toJSON()
    shapeData.objectId = objectId
    const canvasObjects = storage.get('canvasObjects') || {}
    canvasObjects.set(objectId, shapeData)
  }, [])

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "rectangle",
    value: "rectangle",
    icon: "/assets/rectangle.svg",
  });

  const deleteAllShapes = useMutation(({ storage }) => {
    const canvasObjects = storage.get('canvasObjects') || {}
    if(!canvasObjects || canvasObjects.size === 0) return true
    for (const [key, value] of canvasObjects.entries() as any) {
      canvasObjects.delete(key)
    }
    return canvasObjects.size === 0
  }, [])

  const deleteShapeFromStorage = useMutation(({ storage }, objectId: string) => {
    const canvasObjects = storage.get('canvasObjects') || {}
    if(!canvasObjects || canvasObjects.size === 0) return true
    canvasObjects.delete(objectId)
  }, [])

  const handleActiveElement = (element: ActiveElement) => {
    setActiveElement(element)
    switch(element?.value) {
      case 'reset':
        deleteAllShapes()
        fabricRef.current?.clear()
        setActiveElement(defaultNavElement)
        break
      case 'delete':
        handleDelete(fabricRef.current as any, deleteShapeFromStorage)
        setActiveElement(defaultNavElement)
        break;
      case 'image':
        imageInputRef.current?.click()
        isDrawing.current = false
        if(fabricRef.current) {
          fabricRef.current.isDrawingMode = false
        }
        break;
      default:
        break;
    }
    selectedShapeRef.current = element?.value as string
  }

  useEffect(() => {
    const canvas = initializeFabric({canvasRef, fabricRef})

    canvas.on('mouse:down', (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef
      })
    })

    canvas.on('mouse:move', (options) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage
      })
    })

    canvas.on('mouse:up', (options) => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
        activeObjectRef
      })
    })

    canvas.on('object:modified', (options) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage
      })
    })

    canvas.on('selection:created', (options) => {
      handleCanvasSelectionCreated({
        options: options,
        isEditingRef,
        setElementAttributes
      })
    })

    canvas.on('object:scaling', (options) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes
      })
    })

    canvas.on('path:created', (options) => {
      handlePathCreated({
        options,
        syncShapeInStorage
      })
    })
    
    window.addEventListener('resize', () => {
      handleResize({ fabricRef } as any)
    })

    window.addEventListener('keydown', (e) => {
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage
      })
    })

    return () => {
      canvas.dispose()
    }
  }, [])

  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef    
    })
  }, [canvasObjects])

  return (
    <main className="h-screen overflow-hidden">
      <Navbar
        activeElement={activeElement}
        handleActiveElement={handleActiveElement}
        imageInputRef={imageInputRef}
        handleImageUpload={(e: any) => {
          e.stopPropagation()
          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage
          })
        }}
      />
      <section className="flex h-full flex-row">
        <LeftSidebar allShapes={Array.from(canvasObjects)}/>
          <Live canvasRef={canvasRef} undo={undo} redo={redo}/>
        <RightSidebar
          elementAttributes={elementsAttributes}
          setElementAttributes={setElementAttributes}
          fabricRef={fabricRef}
          isEditingRef={isEditingRef}
          activeObjectRef={activeObjectRef}
          syncShapeInStorage={syncShapeInStorage}
        />
      </section>
    </main>
  );
}