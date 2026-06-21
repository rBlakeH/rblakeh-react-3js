import { useEffect, useRef, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader = new GLTFLoader()
const cache = {}

// Preload a model into cache
export function preloadModel(path) {
  if (cache[path]) return
  cache[path] = new Promise((resolve, reject) => {
    loader.load(path, resolve, undefined, reject)
  })
}

// Load a single model (from cache or fetch)
export function useModel(path, meshName) {
  const [model, setModel] = useState(null)
  const sceneRef = useRef()

  useEffect(() => {
    if (!path) return

    // Preload if not already cached
    if (!cache[path]) {
      preloadModel(path)
    }

    cache[path].then((gltf) => {
      const scene = gltf.scene.clone()
      if (meshName) {
        const mesh = scene.getObjectByName(meshName)
        if (mesh) {
          sceneRef.current = mesh.clone()
        } else {
          console.warn(`Mesh "${meshName}" not found in ${path}`)
          sceneRef.current = scene
        }
      } else {
        sceneRef.current = scene
      }
      setModel(sceneRef.current)
    }).catch((err) => {
      console.error(`Failed to load model: ${path}`, err)
    })
  }, [path, meshName])

  return model
}

// Load multiple models at once
export function useModels(paths) {
  const [models, setModels] = useState({})

  useEffect(() => {
    if (!paths || paths.length === 0) return

    const promises = paths.map((path) => {
      if (!cache[path]) preloadModel(path)
      return cache[path].then((gltf) => ({
        path,
        scene: gltf.scene.clone(),
      }))
    })

    Promise.all(promises)
      .then((results) => {
        const loaded = {}
        results.forEach(({ path, scene }) => {
          loaded[path] = scene
        })
        setModels(loaded)
      })
      .catch((err) => console.error('Failed to load models', err))
  }, [paths])

  return models
}
